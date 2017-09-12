require('dotenv').config()

module.exports = {
	http_port:      9999,
	index_page_url: 'http://localhost:9999',
  database: process.env.DB_NAME || 'database.json'
}
