var express = require('express');
var app = express();
var path    = require("path");
const bodyParser = require("body-parser");

const Sequelize = require('sequelize');
//-------------------------------------------
const sequelize = new Sequelize({
    database: 'bed_management',
    username: 'root',
    password: null,
    dialect: 'mysql'
});

sequelize.authenticate().then(() => {
        console.log('Connection has been established successfully');});

var Medic = sequelize.define('Medic', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nume: {
        type: Sequelize.STRING
    },
    prenume: {
        type: Sequelize.STRING
    },
    grad: {
        type: Sequelize.STRING
    },
    specializare: {
        type: Sequelize.STRING
    }
});

var Pacient = sequelize.define('Pacient', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nume: {
        type: Sequelize.STRING
    },
    prenume: {
        type: Sequelize.STRING
    },
    sex: {
        type: Sequelize.BOOLEAN
    },
    varsta: {
        type: Sequelize.INTEGER
    },
    inaltime: {
        type: Sequelize.REAL
    },
    greutate: {
        type: Sequelize.INTEGER
    },
    indiceMasaCorporala: {
        type: Sequelize.REAL
    },
    dataInternare: {
        type: Sequelize.STRING
    },
    dataExternare: {
        type: Sequelize.STRING
    },
    diagnostic: {
        type: Sequelize.STRING
    },
    paraclinicProgramari: {
        type: Sequelize.STRING
    },
    paraclinicRezultate: {
        type: Sequelize.STRING
    },
    tratament: {
        type: Sequelize.STRING
    }
});

var Bed = sequelize.define('Bed', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    bedStatus: {
        type: Sequelize.INTEGER
    },
    data_eliberare: {
        type: Sequelize.STRING,
        allowNull: true
    },
    salon: {
        type: Sequelize.INTEGER
    }
});

Bed.belongsTo(Pacient);
Pacient.belongsTo(Medic); //pacient.medic
Bed.belongsTo(Medic, {foreignKey: 'medic_detinator'});
Bed.belongsTo(Medic, {foreignKey: 'medic_curant'});

//Applying Item Table to database
//sequelize.sync({force:true});
//-------------------------------------------
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use('/images', express.static(__dirname + "/images"));

app.get('/addBed', function (req, res) {
    res.sendFile(path.join(__dirname+'/public/addBed.html'));
});

app.post('/addBed', function (req, res) {
    Bed.create({ salon: req.body.salon, bedStatus: 0 });
    res.sendFile(path.join(__dirname+'/public/addBed.html'));
});

app.get('/getBeds', function (req, res) {
    let freeBeds = [];
    Bed.findAll().then(beds => {
        beds.forEach(function (bed) {
            //if (bed.bedStatus == 0) {
                freeBeds.push(bed);
            //}
        });
        res.send(freeBeds);
    });
});

app.get('/getDoctors', function (req, res) {
    Medic.findAll().then(doctors => {
        res.send(doctors);
    });
});

app.get('/hPlan', function (req, res) {
    res.sendFile(path.join(__dirname+'/public/hPlan.html'));
});

app.get('/getPacient/:id', function (req, res) {
    Pacient.findAll().then((pacients) => {
        pacients.forEach(function (pacient) {
            if (pacient.dataValues.id == req.params.id) {
                res.send(pacient);
            }
        });
    });
});

app.get('/getMedic/:id', function (req, res) {
    Medic.findAll().then((doctors) => {
        doctors.forEach(function (doctor) {
            if (doctor.dataValues.id == req.params.id) {
                res.send(doctor);
            }
        });
    });
});

app.get('/addMedic', function (req, res) {
    res.sendFile(path.join(__dirname+'/public/addMedic.html'));
});

app.post('/addMedic', function (req, res) {
    let nume = "";
    let prenume = "";
    let grad = "";
    let specializare = "";
    nume = req.body.nume;
    prenume = req.body.prenume;
    specializare = req.body.specializare;
    grad = req.body.grad;
    var data = req.body;
    Medic.create({ nume: nume, prenume: prenume, grad: grad, specializare: specializare }).then(() => {
        let medicId;
        Medic.findAll().then(doctors => {
            doctors.forEach(function (doctor) {
                if (doctor.dataValues.nume == nume && doctor.dataValues.prenume == prenume
                    && doctor.dataValues.grad == grad && doctor.dataValues.specializare == specializare) {
                    //console.log("IsIn");
                    medicId = doctor.dataValues.id;
                    for (const [key, value] of Object.entries(data)) {
                        if (!isNaN(key)) {
                            Bed.update({ medic_detinator: medicId }, {
                                where: { id: key }
                            }).then(() => {});
                        }
                    }
                }
            });
        });
    });
    res.sendFile(path.join(__dirname+'/public/addMedic.html'));
});

app.get('/addPacient', function (req, res) {
    res.sendFile(path.join(__dirname+'/public/addPacient.html'));
});

app.post('/reserveBed', function (req, res) {
    let idP = req.body.idP;
    let idB = req.body.idB;
    let dataExt = req.body.dataExt;
    Bed.update({ PacientId: idP, bedStatus: 1, data_eliberare: dataExt }, {
        where: { id: idB }
    }).then(() => {
        res.send();
    });
});

let lastPacientId;
let lastDoctorId;

app.post('/addPacient', function (req, res) {
    let nume = req.body.nume;
    let prenume = req.body.prenume;
    let sex = req.body.sex;
    let varsta = req.body.varsta;
    let inaltime = req.body.inaltime;
    let greutate = req.body.greutate;
    let indiceMasaCorporala = greutate / Math.pow((inaltime * 1.0 / 100), 2);
    let dataInternare = req.body.dataInternare;
    let dataExternare = req.body.dataExternare;
    let diagnostic = req.body.diagnostic;
    let paraProgramari = req.body.paraProgramari;
    let paraRezultate = req.body.paraRezultate;
    let tratament = req.body.tratament;
    let medic = req.body.medic;
    Pacient.create({ nume: nume, prenume: prenume, sex: sex, varsta: varsta, inaltime: inaltime, greutate: greutate, indiceMasaCorporala: indiceMasaCorporala,
    dataInternare: dataInternare, dataExternare: dataExternare, diagnostic: diagnostic, paraclinicProgramari: paraProgramari, paraclinicRezultate: paraRezultate,
    tratament: tratament, MedicId: medic }).then(() => {
        Pacient.findAll().then(pacients => {
            pacients.forEach(function (pacient) {
                if (pacient.dataValues.nume == nume && pacient.dataValues.prenume == prenume && pacient.dataValues.varsta == varsta && pacient.dataValues.inaltime == inaltime && pacient.dataValues.greutate == greutate && pacient.dataValues.diagnostic == diagnostic && pacient.dataValues.tratament == tratament) {
                        lastPacientId = pacient.dataValues.id;
                        lastDoctorId = pacient.dataValues.MedicId;
                        res.status(200).sendFile(path.join(__dirname+'/public/selectBed.html'));
                }
            });
        });
    });
});

app.get('/getLastPacientId', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ idP: lastPacientId, idM: lastDoctorId }));
});

app.get('/selectBed', function (req, res) {
    res.sendFile(path.join(__dirname+'/public/selectBed.html'));
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/public/home.html'));
});

var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)

});