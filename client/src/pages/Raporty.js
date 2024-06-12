import React, { useState, useEffect } from 'react';
import { Select, Space, Segmented } from 'antd';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    BarChart, Bar, ResponsiveContainer,
    RadialBarChart, RadialBar, AreaChart, Area,
} from 'recharts';
import Chart from 'react-google-charts';
import './Raporty.css';

const Raporty = () => {
    const [projects, setProjects] = useState([]);
    const [projektData, setProjektData] = useState(null);
    const [logData, setLogData] = useState([]);
    const [czasZadania, setCzasZadania] = useState([]);
    const [iloscZadan, setIloscZadan] = useState([]);
    const [areaChartData, setAreaChartData] = useState([]);
    const [selectedSegment, setSelectedSegment] = useState('project');
    const [ganttData, setGanttData] = useState([]);

    // usuniecie powiadomienia o wersji google charts xd
    const originalWarn = console.warn;
    console.warn = function (...args) {
        const arg = args && args[0];

        if (arg && arg.includes('Attempting to load version \'51\' of Google Charts')) return;

        originalWarn(...args);
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:5000/projects', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Nie udało się pobrać projektów');
            }

            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchRaport = async (value) => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:5000/raport/${value}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Nie udało się pobrać raportu');
            }

            const data = await response.json();
            setProjektData(data.raport);
            //console.log(data);

            const AreaWykres = data.zadania.map((zadanie, index) => ({
                name: zadanie.tytul,
                komentarzy: zadanie.komentarzy,
                zalacznikow: zadanie.zalacznikow,
            }));

            setAreaChartData(AreaWykres);

        } catch (error) {
            console.error(error);
        }
    };

    const fetchLogi = async (value) => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:5000/logi/${value}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
    
            if (!response.ok) {
                throw new Error('Nie udało się pobrać logów');
            }

            const response2 = await fetch(`http://localhost:5000/logi2/${value}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
    
            if (!response2.ok) {
                throw new Error('Nie udało się pobrać logów');
            }
    
            const data = await response.json();
            const data2 = await response2.json();
            //console.log(data);

            const transformedData = zmianyZadania(data.logi);
            setLogData(transformedData);
            const ganttData = logiDoTimeline(data2.logi);
            //console.log(ganttData);

            setGanttData(ganttData);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchZadania = async (value) => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:5000/tasks/${value}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Nie udało się pobrać zadań');
            }

            const data = await response.json();
            //console.log(data.tasks);

            const transformedData = statusyZadania(data.tasks, data.users);
            setIloscZadan(transformedData);
            //console.log(transformedData);

            const czasZadania = data.tasks.map(task => {
                const [hours, minutes, seconds] = task.pozostaly_czas.split(':').map(Number);
                const pozostaly = (hours * 60 * 60) + (minutes * 60) + seconds;
                const [hours2, minutes2, seconds2] = task.szacowany_czas.split(':').map(Number);
                const szacowany = (hours2 * 60 * 60) + (minutes2 * 60) + seconds2;

                const losowyKolor = Math.floor(Math.random()*16777215).toString(16);

                return { name: task.tytul, uv: Math.round((pozostaly / szacowany) * 100), pv: 100, fill: `#${losowyKolor}` };
            });

            //console.log(czasZadania);

            setCzasZadania(czasZadania);
        } catch (error) {
            console.error(error);
        }
    };

    const formatTime = (time) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;

        return `${hours}h ${minutes}m ${seconds}s`;
    };

    const handleChange = (value) => {
        fetchRaport(value);
        fetchLogi(value);
        fetchZadania(value);
    };

    const zmianyZadania = (logi) => {
        if (!Array.isArray(logi)) {
            return [];
        }

        const iloscZmian = {};

        logi.filter(log => log.uzytkownik_id !== null).forEach(log => {
            const nazwaUzytkownika = `${log.imie} ${log.nazwisko}`;
            if (!iloscZmian[nazwaUzytkownika]) {
                iloscZmian[nazwaUzytkownika] = { name: nazwaUzytkownika, Trwajace: 0, 'Do zrobienia': 0, Zrobione: 0 };
            }
            iloscZmian[nazwaUzytkownika][log.status] += 1;
        });

        return Object.values(iloscZmian);
    };

    const statusyZadania = (tasks, users) => {
        const iloscZadan = {};

        users.forEach(user => {
            const nazwaUzytkownika = `${user.imie} ${user.nazwisko}`;
            if (!iloscZadan[nazwaUzytkownika]) {
                iloscZadan[nazwaUzytkownika] = { name: nazwaUzytkownika, Trwajace: 0, 'Do zrobienia': 0, Zrobione: 0, Utworzono: 0 };
            }
        });

        tasks.forEach(task => {
            const user = users.find(user => user.uzytkownik_id === task.uzytkownik_id);
            if (user) {
                const nazwaUzytkownika = `${user.imie} ${user.nazwisko}`;
                if (iloscZadan[nazwaUzytkownika][task.status] !== undefined) {
                    iloscZadan[nazwaUzytkownika][task.status] += 1;
                }
            }
        });

        return Object.values(iloscZadan);
    };
      
    const styleRadar = {
        top: '50%',
        right: 0,
        transform: 'translate(0, -50%)',
        lineHeight: '24px',
    };

    const logiDoTimeline = (logi) => {
        return logi.map((log, index) => {
            const startDate = log.czas_rozpoczecia ? new Date(log.czas_rozpoczecia.replace(' ', 'T')) : null;
            const endDate = log.czas_zakonczenia ? new Date(log.czas_zakonczenia.replace(' ', 'T')) : null;
    
            return [
                `Task_${log.zadanie_id}`,
                log.tytul,
                log.imie + ' ' + log.nazwisko,
                startDate,
                endDate,
                log.czas_trwania,
                log.status === "Zrobione" ? 100 : log.status === "Trwajace" ? 50 : 0,
                null,
            ];
        });
    };    

    return (
        <div className='content'>
            <div className='contentTop'>
                <h1>Raporty</h1>
            </div>
            <div className='contentBottom-raporty'>
                <Space align='start'>
                    <Select 
                        defaultValue="Wybierz projekt" 
                        style={{ width: 200 }} 
                        onChange={handleChange}
                        options={projects.map((project) => {
                            return { label: project.tytul, value: project.projekt_id }
                        })}
                    />
                    <Segmented
                        options={[
                            { label: 'Projekt', value: 'project' },
                            { label: 'Zadania', value: 'tasks' },
                        ]}
                        onChange={(value) => setSelectedSegment(value)}
                        value={selectedSegment}
                    />
                </Space>
                {selectedSegment === 'project' ? (
                    <div className="dashboard">
                        <div className="metric-container">
                            <div className="metric">
                                <h2>Czas pracy</h2>
                                <p>W ciągu</p>
                                <p>{projektData && projektData[0] ? formatTime(projektData[0].suma_czasu) : null}</p>
                                <p>ukończono {projektData && projektData[0] ? (projektData[0].zrobione / (projektData[0].zrobione + projektData[0].do_zrobienia + projektData[0].trwajace) * 100).toFixed(2) : null}% zadań</p>
                            </div>
                            <div className="metric">
                                <h2>Statusy zadań</h2>
                                <p>{projektData && projektData[0] ? projektData[0].trwajace : null} w trakcie</p>
                                <p>{projektData && projektData[0] ? projektData[0].do_zrobienia : null} do zrobienia</p>
                                <p>{projektData && projektData[0] ? projektData[0].zrobione : null} zrobione</p>
                            </div>
                            <div className="metric">
                                <h2>Efektywność</h2>
                                <p>{projektData && projektData[0] ? 100 - ((projektData[0].suma_czasu / projektData[0].suma_szac) * 100).toFixed(2) : null}%</p>
                                <p>pozostałego czasu nad zadaniami do szacowanego</p>
                            </div>
                            <div className="metric">
                                <h2>Inne</h2>
                                <p>{projektData && projektData[0] ? (projektData[0].suma_logow / projektData[0].dni_od).toFixed(2) : null} zmian/dzień</p>
                                <p>{projektData && projektData[0] ? formatTime(projektData[0].suma_szac) : null} suma szacowanego czasu</p>
                                <p>{projektData && projektData[0] ? formatTime(projektData[0].czas_od) : null} od założenia projektu</p>
                            </div>
                        </div>
                        <div className="charts-container">
                            <div className="chart">
                                <h3>Czas i aktywność w zadaniach</h3>
                                <div style={{ display: 'flex' }}>
                                    <ResponsiveContainer width="30%" height={300}>
                                        <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={czasZadania}>
                                            <RadialBar
                                                minAngle={15}
                                                label={{ position: 'insideStart', fill: '#fff' }}
                                                background
                                                clockWise
                                                dataKey="uv"
                                            />
                                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={styleRadar} />
                                            <text x="50%" y="10%" textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#000">
                                                % szacowanego czasu
                                            </text>
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <ResponsiveContainer width="70%" height={300}>
                                        <AreaChart data={areaChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorKomentarzy" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorZalacznikow" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="komentarzy" stroke="#8884d8" fillOpacity={1} fill="url(#colorKomentarzy)" />
                                            <Area type="monotone" dataKey="zalacznikow" stroke="#82ca9d" fillOpacity={1} fill="url(#colorZalacznikow)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="chart">
                                <h3>Zadania</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={iloscZadan}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Trwajace" stackId="a" fill="#ffc658" />
                                        <Bar dataKey="Do zrobienia" stackId="a" fill="#8884d8" />
                                        <Bar dataKey="Zrobione" stackId="a" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart">
                                <h3>Zmiany w zadaniach</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={logData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Trwajace" stackId="a" fill="#ffc658" />
                                        <Bar dataKey="Do zrobienia" stackId="a" fill="#8884d8" />
                                        <Bar dataKey="Zrobione" stackId="a" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="dashboard">
                        <div className="charts-container">
                            <div className='charts'>
                                <ResponsiveContainer width="100%" height={400}>
                                    <Chart
                                        chartType="Timeline"
                                        width="100%"
                                        height="400px"
                                        data={[
                                            [
                                                { type: 'string', id: 'Task Title' },
                                                { type: 'string', id: 'User Name' },
                                                { type: 'date', id: 'Start Date' },
                                                { type: 'date', id: 'End Date' },
                                            ],
                                            ...ganttData.map(task => [task[1], task[2], task[3], task[4]]),
                                        ]}
                                        options={{
                                            height: 400,
                                        }}
                                    />
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Raporty;