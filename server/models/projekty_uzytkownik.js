module.exports = (sequelize, DataTypes) => {
    const ProjektyUzytkownik = sequelize.define('projekty_uzytkownik', {
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