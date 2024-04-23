const { Pool } = require('pg')
var fs = require('fs')

const pool = new Pool({
	user: process.env.PG_USER,
	host: process.env.PG_HOST,
	database: process.env.PG_DB,
	password: process.env.PG_PW,
	port: process.env.PG_PORT,
	ssl: {
		require: true,
		cert: fs.readFileSync(process.env.PG_SSL_PATH),
		rejectUnauthorized: true,
	}
})
module.exports.insertCase = async (c) => {
	const props = []
	for (prop in c) {
		props.push(prop)
	}
	let query = 'insert into public.cases('
	for (const [i, prop] of props.entries()) {
		query += `"${prop}"`
		query += (i == props.length - 1) ? '' : ', '
	}
	query += ') values ('
	for (const [i, prop] of props.entries()) {
		if (typeof c[prop] == 'object') {
			query += 'null'
		} else {
			query += typeof c[prop] == 'string' ? `'${c[prop]}'` : `${c[prop]}`
		}
		query += (i == props.length - 1) ? '' : ', '
	}
	query += ')'
	const client = await pool.connect()
	await client.query(query)
	client.release()
}
module.exports.updateCase = async (id, changes) => {
	let query = 'update public.cases set '
	const props = []
	for (prop in changes) {
		props.push(prop)
	}
	for (const [i, prop] of props.entries()) {
		query += `${prop} = `
		query += typeof changes[prop] == 'string' ? `'${changes[prop]}'` : `${changes[prop]}`
		query += (i == props.length - 1) ? ' ' : ', '
	}
	query += `where acumatica_id = '${id}'`
	const client = await pool.connect()
	await client.query(query)
	client.release()
}
module.exports.getData = async () => {
	const client = await pool.connect()
	const cases = await client.query('select * from public.cases order by id')
	client.release()
	return cases.rows
}