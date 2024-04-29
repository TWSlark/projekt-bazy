import React, { useEffect, useState } from "react";
import { Avatar, Col, Row, Button } from "antd";

const Profil = () => {
    const [data, setData] = useState({});

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');

            const response = await fetch(`http://localhost:5000/profil`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            console.log(data);
            setData(data);
        } catch (error) {
            console.error('Blad przy pobieraniu profilu', error);
        }
    };

    const stringToColor = (str) => {
        let hash = 0;
        str.split('').forEach(char => {
            hash = char.charCodeAt(0) + ((hash << 5) - hash)
        })
        let color = '#'
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xff
            color += value.toString(16).padStart(2, '0')
        }
        return color
    };
        
    return (
        <div className='content'>
            <div className='contentTop'>
                <h1>Profil</h1>
            </div>
            <div style={{ padding: '30px', }} className='contentBottom'>
                <Row gutter={[16, 16]}>
                    <Col>
                        <Avatar size={250} style={{ backgroundColor: stringToColor(data.imie || ''), fontSize: '120px' }}>{data.imie ? data.imie.charAt(0) : ''}</Avatar>
                    </Col>
                    <Col>
                        <div>
                            <h1>{data.imie} {data.nazwisko}</h1>
                            <h2>Email: {data.email}</h2>
                            <h2>Data urodzenia: {data.data_urodzenia}</h2>
                            <h2>Płeć: {data.plec === '1' ? 'Mężczyzna' : 'Kobieta'}</h2>
                            <h2>Typ konta: {data.typ_konta === 'manager' ? 'Manager' : 'h1racownik'}</h2>
                            <h2>Wspomógł projektów: {data.liczba_projektow}</h2>
                            <Button type="primary">
                                Zmień hasło
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default Profil;