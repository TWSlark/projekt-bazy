import React, { useEffect, useState } from "react";
import { Avatar, Col, Row, Button, Modal } from "antd";
import axios from "axios";

const Profil = () => {
    const [data, setData] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [editData, setEditData] = useState({
        imie: '',
        nazwisko: '',
        data_urodzenia: '',
        plec: '',
    });

    const validateForm = () => {
        const trimmedImie = editData.imie.trim();
        const trimmedNazwisko = editData.nazwisko.trim();
        const trimmedDataUrodzenia = editData.data_urodzenia.trim();

        if (!trimmedImie || !trimmedNazwisko || !trimmedDataUrodzenia || !editData.plec) {
            alert('Wszystkie pola muszą być wypełnione.');
            return false;
        }
        return true;
    };
    console.log(data);

    useEffect(() => {
        getProfile();
    }, []);

    const showModal = () => {
        setIsModalOpen(true);
      };
    
      const handleCancel = () => {
        setIsModalOpen(false);
      };

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

    const sendMail = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const email = document.getElementById('email').value;
            console.log('email: ', email);

            const response = await axios.post(`http://localhost:5000/requestNewPass`, 
            {
                email: email
            },{
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
        } catch (error) {
            console.error('Blad przy requescie zmiany hasła', error);
            if (error.response && error.response.status === 404) {
                alert('Użytkownik o podanym mailu nie istnieje');
              } else {
                console.error('Błąd przy requescie zmiany hasła', error);
              }
        }
        setIsModalOpen(false);
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

    const showEditModal = () => {
        setEditData({
            imie: data.imie,
            nazwisko: data.nazwisko,
            data_urodzenia: '',
            plec: data.plec,
        });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleEditSave = async () => {
    if(validateForm()){
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await axios.put(`http://localhost:5000/updateProfil`, editData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 200) {
                setData({ ...data, ...editData });
                setIsEditModalOpen(false);
            }
        } catch (error) {
            console.error('Blad przy aktualizacji profilu', error);
        }
    }
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
                            <h2>Typ konta: {data.typ_konta === 'manager' ? 'Manager' : 'Pracownik'}</h2>
                            <h2>Kolaborator {data.liczba_projektow} {data.liczba_projektow !== '1' ? 'projektów.' : 'projektu.'}</h2>
                            <Button type="primary" className="passChange" onClick={showModal}>
                                Zmień hasło
                            </Button>
                            <Modal title="Zmiana Hasła" open={isModalOpen} onOk={sendMail} onCancel={handleCancel}>
                            <input type="email" placeholder="Podaj swój adres email" id="email" name="email" required />
                            </Modal>
                            <Button type="primary" onClick={showEditModal}>
                                Edytuj profil
                            </Button>
                            <Modal className="editProfile" title="Edycja Profilu" open={isEditModalOpen} onOk={handleEditSave} onCancel={() => setIsEditModalOpen(false)}>
                                <input type="text" placeholder="Imię" name="imie" value={editData.imie} onChange={handleEditChange} required />
                                <input type="text" placeholder="Nazwisko" name="nazwisko" value={editData.nazwisko} onChange={handleEditChange} required />
                                <input type="date" placeholder="Data urodzenia" name="data_urodzenia" onChange={handleEditChange} required />
                                <select name="plec"  value={editData.plec} onChange={handleEditChange} required>
                                    <option value="1">Mężczyzna</option>
                                    <option value="2">Kobieta</option>
                                </select>
                            </Modal>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default Profil;