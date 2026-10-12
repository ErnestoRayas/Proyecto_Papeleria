const { openDatabase } = require('./database.cjs');
const { createApp } = require('./app.cjs');
const db = openDatabase();
const server = createApp(db).listen(process.env.PORT || 3001, () => console.log(`Papelería Karen API: http://localhost:${process.env.PORT || 3001}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
