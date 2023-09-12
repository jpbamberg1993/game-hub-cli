import { environmentValid } from "./environmentValid.js"
import { Games } from "./games.js"

export async function createEntity(entity: string, environment: string) {
	if (!environmentValid(environment)) return
	switch (entity) {
		case 'game':
			const gamesRepository = new Games(environment)
			await gamesRepository.createGames()
			break
		default:
			console.error(`--> ${entity} is not a valid entity`)
	}
}
