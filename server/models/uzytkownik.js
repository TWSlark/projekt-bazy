const { ProjektyUzytkownik } = require("../database");

module.exports = (sequelize, DataTypes) => {
    const Uzytkownik = sequelize.define('uzytkownik', {
      uzytkownik_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      haslo: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      imie: {
        type: DataTypes.STRING(45),
        allowNull: false
      },
      nazwisko: {
        type: DataTypes.STRING(45),
        allowNull: false
      },
      data_urodzenia: {
        type: DataTypes.DATE,
        allowNull: false
      },
      plec: {
        type: DataTypes.ENUM('1', '2'),
        allowNull: false
      },
      typ_konta: {
        type: DataTypes.ENUM('uzytkownik', 'manager'),
        allowNull: false
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      refreshToken: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    }, {
        freezeTableName: true,
        timestamps: false,
        subQuery: false
    });

    Uzytkownik.associate = (models) => {
      Uzytkownik.belongsToMany(models.Projekty, { through: models.ProjektyUzytkownik, foreignKey: 'uzytkownik_id' });
    };

    return Uzytkownik;
};