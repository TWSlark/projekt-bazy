const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  database: process.env.DATABASE,
  username: process.env.USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  dialect: 'mysql',
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Poloczono z baza, sequelize.');
  })
  .catch(err => {
    console.error('Nie mozna polaczyc z baza, sequelize:', err);
  });

const UzytkownikModel = require('./models/uzytkownik.js');
const ProjektyModel = require('./models/projekty.js');

const Uzytkownik = UzytkownikModel(sequelize, Sequelize);
const Projekty = ProjektyModel(sequelize, Sequelize);

Uzytkownik.belongsToMany(Projekty, { through: 'projekty_uzytkownik', foreignKey: 'uzytkownik_id' });
Projekty.belongsToMany(Uzytkownik, { through: 'projekty_uzytkownik', foreignKey: 'projekt_id' });

module.exports = {
  sequelize,
  Uzytkownik,
  Projekty,
};