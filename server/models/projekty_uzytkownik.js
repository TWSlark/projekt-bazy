module.exports = (sequelize, DataTypes) => {
    const ProjektyUzytkownik = sequelize.define('projekty_uzytkownik', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        projekt_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        uzytkownik_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        freezeTableName: true,
        timestamps: false,
        subQuery: false
    });
  
    return ProjektyUzytkownik;
};