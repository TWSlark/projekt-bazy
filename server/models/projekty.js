module.exports = (sequelize, DataTypes) => {
    const Projekty = sequelize.define('projekty', {
      projekt_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tytul: {
        type: DataTypes.STRING(100),
        allowNull: false
      }
    }, {
        freezeTableName: true,
        timestamps: false,
        subQuery: false
    });
  
    Projekty.associate = (models) => {
        Projekty.belongsToMany(models.Uzytkownik, { through: 'projekty_uzytkownik', foreignKey: 'projekt_id' });
    };

    Projekty.associate = (models) => {
        Projekty.hasMany(models.Zadania, { foreignKey: 'projekt_id' });
    };

    return Projekty;
};