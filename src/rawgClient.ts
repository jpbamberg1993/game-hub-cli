import * as https from "https"

export class RawgClient {
	public async getGames(page: number) {
		const parameters = new URLSearchParams()
		parameters.set(`key`, process.env.RAWG_API_KEY ?? ``)
		parameters.set(`page`, page.toString())
		return new Promise((resolve, reject) => {
			https
				.get(
					`https://api.rawg.io/api/games?${parameters.toString()}`,
					(res) => {
						let data = ``

						res.on(`data`, (chunk) => {
							data += chunk
						})

						res.on(`end`, () => {
							const dataJson = JSON.parse(data)
							resolve(dataJson.results)
						})
					}
				)
				.on(`error`, (err) => {
					console.error(err)
					reject(err)
				})
		})
	}
}
