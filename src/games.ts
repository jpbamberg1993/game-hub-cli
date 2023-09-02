import { v4 as uuid } from 'uuid'
import { BatchWriteItemCommand, DeleteItemCommand, DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { RawgClient } from "./rawgClient.js"
import { snakeToCamelCase } from "./snakeToCamelCase.js"

export class Games {
	private tables = new Map([
		['dev', 'game-hub-user-api-dev'],
		['int', 'game-hub-user-api-int'],
	])
	private readonly table: string
	private docClient: DynamoDBClient
	private rawgClient: RawgClient

	constructor(private readonly env: string) {
		this.table = this.tables.get(env)!
		this.docClient = this.instantiateDocClient(env)
		this.rawgClient = new RawgClient()
	}

	public async seedGames() {
		console.log(`--> Seeding games, in ${this.env}`)
		for (let i = 1; i <= 10; i += 10) {
			const saveTasks: Promise<void>[] = new Array(10)
			for (let j = i; j <= i + 10; j++) {
				saveTasks.push(this.fetchAndCreateGames(j))
			}
		}
	}

	public async deleteGames() {
		console.log(`--> Deleting games, in ${this.env}`)

		let lastEvaluatedKey: string | undefined = ''
		do {
			const {
				LastEvaluatedKey,
				Items: games
			} = await this.getGames(lastEvaluatedKey)
			lastEvaluatedKey = LastEvaluatedKey?.toString()
			const deleteTasks = games?.map(g => {
				const game = unmarshall(g)
				return this.deleteGame(game)
			})
			if (!deleteTasks) return
			await Promise.all(deleteTasks)
		} while (lastEvaluatedKey)

		console.log(`--> Deleted games, in ${this.env}`)
	}

	private deleteGame(game: Record<string, any>) {
		const params = {
			TableName: this.table,
			Key: marshall({
				entityType: `Game`,
				id: game.id,
			})
		}
		return this.docClient.send(new DeleteItemCommand(params))
	}

	private async getGames(lastEvaluatedKey: string = '') {
		const params = {
			TableName: this.table,
			KeyConditionExpression: `#entityType = :entityType`,
			ExpressionAttributeNames: {
				'#entityType': `entityType`,
			},
			ExpressionAttributeValues: marshall({
				':entityType': `Game`,
			}),
			LastEvaluatedKey: lastEvaluatedKey,
			Limit: 20,
		}

		const command = new QueryCommand(params)

		return await this.docClient.send(command)
	}

	private instantiateDocClient(env: string) {
		if (env === 'dev') {
			return new DynamoDBClient({
				region: 'localhost',
				endpoint: 'http://localhost:8000',
			})
		}
		return new DynamoDBClient({})
	}

	private async createGames(games: any) {
		const params = {
			RequestItems: {
				[this.table]: games.map((game: any) => {
					const timestamp = new Date().getTime()
					const mappedGame = snakeToCamelCase(game)
					return {
						PutRequest: {
							Item: marshall(
								{
									...mappedGame,
									id: uuid(),
									entityType: `Game`,
									createdAt: timestamp,
									updatedAt: timestamp,
									sourceId: game.id,
								},
								{
									removeUndefinedValues: true
								},
							)
						}
					}
				})
			}
		}

		try {
			await this.docClient.send(new BatchWriteItemCommand(params))
		} catch (e) {
			console.error(e)
		}
	}

	private async fetchAndCreateGames(page: number) {
		const data = await this.rawgClient.getGames(page)
		await this.createGames(data)
	}
}
