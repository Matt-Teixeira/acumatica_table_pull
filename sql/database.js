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
module.exports.insertRecord = async (table, object) => {
	const props = Object.keys(object)
	let query = `insert into ${table}(`
	for (const [i, prop] of props.entries()) {
		query += `"${prop}"`
		query += (i == props.length - 1) ? '' : ', '
	}
	query += ') values ('
	for (const [i, prop] of props.entries()) {
		if (typeof object[prop] == 'object') {
			query += 'null'
		} else {
			query += typeof object[prop] == 'string' ? `'${object[prop]}'` : `${object[prop]}`
		}
		query += (i == props.length - 1) ? '' : ', '
	}
	query += ')'
	const client = await pool.connect()
	await client.query(query)
	client.release()
}
module.exports.insertCase = async (c) => {
	this.insertRecord('public.cases', c)
}
module.exports.updateRecord = async (table, id, changes) => {
	let query = `update ${table} set `
	const props = Object.keys(changes)
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
module.exports.updateCase = async (id, changes) => {
	this.updateRecord('public.cases', id, changes)
}
module.exports.getCaseData = async () => {
	this.query('select * from public.cases order by id')
}
module.exports.query = async (query) => {
	const client = await pool.connect()
	const cases = await client.query(query)
	client.release()
	return cases.rows
}