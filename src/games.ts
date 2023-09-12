import { unmarshall } from "@aws-sdk/util-dynamodb"
import { makeRunSeedGames } from "./seedGames.js"
import { GamesRepository } from "./gamesRepository.js"

export class Games {
	private readonly gamesRepository: GamesRepository

	constructor(private readonly env: string) {
		this.gamesRepository = new GamesRepository(env)
	}

	public async createGames() {
		console.log(`--> Creating games, in ${this.env}`)
		const runSeedGames = makeRunSeedGames()
		runSeedGames(this.env)
	}

	public async deleteGames() {
		console.log(`--> Deleting games, in ${this.env}`)

		let lastEvaluatedKey: string | undefined = ''
		do {
			let entity = 'Game'
			let getGameResponse = await this.gamesRepository.getGames(lastEvaluatedKey)
			if (getGameResponse.Count === 0) {
				entity = 'Game#Genre'
				getGameResponse = await this.gamesRepository.getGenreGames(lastEvaluatedKey)
			}
			const {Items: games, LastEvaluatedKey} = getGameResponse

			lastEvaluatedKey = LastEvaluatedKey?.toString()
			const deleteTasks = games?.map(g => {
				const game = unmarshall(g)
				return this.gamesRepository.deleteGame(game, entity)
			})
			if (!deleteTasks) return
			await Promise.all(deleteTasks)
		} while (lastEvaluatedKey)
	}

}
