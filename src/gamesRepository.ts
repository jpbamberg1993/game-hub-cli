import { BatchWriteItemCommand, DeleteItemCommand, DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"

export class GamesRepository {
	private tables = new Map([
		['dev', 'game-hub-user-api-dev'],
		['prod', 'game-hub-user-api-int'],
	])
	private readonly table: string
	private docClient: DynamoDBClient

	constructor(private readonly env: string) {
		this.docClient = this.instantiateDocClient(env)
		this.table = this.tables.get(env) || ''
	}

	public async deleteGame(game: Record<string, any>, entityType: string) {
		const params = {
			TableName: this.table,
			Key: marshall({
				entityType,
				id: game.id,
			})
		}
		return await this.docClient.send(new DeleteItemCommand(params))
	}

	public async getGames(lastEvaluatedKey: string = '') {
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

	public async getGenreGames(lastEvaluatedKey: string = '') {
		const params = {
			TableName: this.table,
			KeyConditionExpression: `#entityType = :entityType`,
			ExpressionAttributeNames: {
				'#entityType': `entityType`,
			},
			ExpressionAttributeValues: marshall({
				':entityType': `Game#Genre`,
			}),
			LastEvaluatedKey: lastEvaluatedKey,
			Limit: 20,
		}

		const command = new QueryCommand(params)

		return await this.docClient.send(command)
	}

	public async createGames(games: any) {
		const params = {
			RequestItems: {
				[this.table]: games.map((game: any) => {
					return {
						PutRequest: {
							Item: marshall(
								{...game},
								{removeUndefinedValues: true},
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

	private instantiateDocClient(env: string) {
		if (env === 'dev') {
			return new DynamoDBClient({
				region: 'localhost',
				endpoint: 'http://localhost:8000',
			})
		}
		return new DynamoDBClient({})
	}
}
