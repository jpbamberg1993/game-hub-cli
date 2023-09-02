import figlet from 'figlet'
import 'dotenv/config.js'
import { Command } from 'commander'
import { createEntity } from "./createEntity.js"
import { deleteEntity } from "./deleteEntity.js"

const program = new Command()

program
	.name('game-hub-cli')
	.version('0.0.1')
	.description(`Pull data from the rawg api and import it into Game Hub's dynamodb database.`)
	.action(() => console.log(figlet.textSync('Game Hub CLI')))

program
	.command('create <entity> <environment>')
	.description(`Create entities in game-hub-db from rawg-api`)
	.action(createEntity)

program
	.command('delete <entity> <environment>')
	.description(`Delete entities in game-hub-db`)
	.action(deleteEntity)

program.parse()
