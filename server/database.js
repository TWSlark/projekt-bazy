const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  database: process.env.DATABASE,
  username: process.env.USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  dialect: 'mysql',
  logging: false,
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
const ProjektyUzytkownikModel = require('./models/projekty_uzytkownik.js');
const ZadaniaModel = require('./models/zadania.js');

const Uzytkownik = UzytkownikModel(sequelize, Sequelize);
const Projekty = ProjektyModel(sequelize, Sequelize);
const ProjektyUzytkownik = ProjektyUzytkownikModel(sequelize, Sequelize);
const Zadania = ZadaniaModel(sequelize, Sequelize);

Uzytkownik.belongsToMany(Projekty, { through: ProjektyUzytkownik, foreignKey: 'uzytkownik_id' });
Projekty.belongsToMany(Uzytkownik, { through: ProjektyUzytkownik, foreignKey: 'projekt_id' });
Projekty.hasMany(Zadania, { foreignKey: 'projekt_id' });
Zadania.belongsTo(Projekty, { foreignKey: 'projekt_id' });

module.exports = {
  sequelize,
  Uzytkownik,
  Projekty,
  ProjektyUzytkownik,
  Zadania
};