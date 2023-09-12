import { v4 as uuid } from 'uuid'
import { parentPort } from "worker_threads"
import { GamesRepository } from "./gamesRepository.js"
import { RawgClient } from "./rawgClient.js"
import { snakeToCamelCase } from "./snakeToCamelCase.js"

type Props = {
	page: number
	env: string
}

parentPort?.on("message", async ({page, env}: Props) => {
	await new SeedGamesWorker(page, env).run()
	parentPort?.postMessage("done")
})

class SeedGamesWorker {
	private gamesRepository: GamesRepository
	private rawgClient: RawgClient

	constructor(private readonly page: number, env: string) {
		this.gamesRepository = new GamesRepository(env)
		this.rawgClient = new RawgClient()
	}

	public async run() {
		const data = await this.rawgClient.getGames(this.page) as any[]
		const games = data.map(g => this.generateGameRecord(g))
		for (let i = 0; i < games.length; i++) {
			await this.gamesRepository.createGames(games[i])
		}
	}

	private generateGameRecord(game: any) {
		const timestamp = new Date().getTime()
		const camelCasedGame = snakeToCamelCase(game)
		const gameRecords = []
		const gameId = uuid()
		for (let i = -1; i < game.genres?.length ?? 0; i++) {
			const gameRecord = {
				...camelCasedGame,
				id: gameId,
				entityType: `Game`,
				createdAt: timestamp,
				updatedAt: timestamp,
				sourceId: game.id,
				// @ts-ignore
				platforms: camelCasedGame.platforms.map(p => ({...p.platform, releasedAt: p.releasedAt}))
			}
			if (i >= 0) {
				const genreId = game.genres[i].id
				// @ts-ignore
				gameRecord.gsiOnePk = `Genre#${genreId}`
				gameRecord.entityType += `#Genre`
				gameRecord.id += `#Genre:${genreId}`
			}
			gameRecords.push(gameRecord)
		}
		return gameRecords
	}
}
