module.exports = (sequelize, DataTypes) => {
    const Zadania = sequelize.define('zadania', {
        zadanie_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tytul: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        opis: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('Do zrobienia', 'Trawjace', 'Zrobione'),
            allowNull: false
        },
        priorytet: {
            type: DataTypes.ENUM('Niski', 'Sredni', 'Wysoki'),
            allowNull: false
        },
        do_kiedy: {
            type: DataTypes.DATE,
            allowNull: false
        },
        data_utworzenia: {
            type: DataTypes.DATE,
            allowNull: false
        },
        rozpoczecie_pracy: {
            type: DataTypes.DATE,
            allowNull: true
        },
        zakonczenie_pracy: {
            type: DataTypes.DATE,
            allowNull: true
        },
        projekt_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        freezeTableName: true,
        timestamps: false,
        subQuery: false
    });

    Zadania.associate = (models) => {
        Zadania.belongsTo(models.Projekty, { foreignKey: 'projekt_id' });
    };

    return Zadania;
};