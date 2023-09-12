import { Worker } from "worker_threads"

export function makeRunSeedGames() {
	performance.now()
	const activeThreads: Worker[] = []
	const lastPage = 1_100
	let currentPage = 1_000

	return function runSeedGames(env: string) {
		if (activeThreads.length >= 4) {
			return
		}
		if (currentPage >= lastPage) {
			console.log(`--> Seeding games done: ${performance.now()}`)
			process.exit()
		}

		const thread = new Worker(new URL("./seedGamesWorker.js", import.meta.url))
		activeThreads.push(thread)
		thread.postMessage({page: currentPage, env})
		currentPage++
		thread.on("message", () => {
			activeThreads.splice(activeThreads.indexOf(thread), 1)
			runSeedGames(env)
		})
		runSeedGames(env)
	}
}

