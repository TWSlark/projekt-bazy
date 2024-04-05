function valid(values) {
    let error = {}
    const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-+=])[A-Za-z\d!@#$%^&*()-+=]{8,}$/;
    
    //* imie
    if (values.imie ==="") {
        error.imie = "To pole nie powinno być puste";
    }
    else {
        error.imie = "";
    }


    //* nazwisko
    if (values.nazwisko ==="") {
        error.nazwisko = "To pole nie powinno być puste";
    }
    else {
        error.nazwisko = "";
    }


    //* data
    if (values.data ==="") {
        error.data = "To pole nie powinno być puste";
    }
    else {
        error.data = "";
    }


    //* login
    if (values.email ==="") {
        error.email = "To pole nie powinno być puste";
    }
    else if (!emailRe.test(values.email)) {
        error.email = "Email jest nie poprawny"
    }
    else {
        error.email = "";
    }


    //*hasło
    if (values.haslo ==="") {
        error.haslo = "To pole nie powinno być puste";
    }
    else if (!passRe.test(values.haslo)) {
        error.haslo = "Hasło jest nie poprawne"
    }
     else {
         error.haslo = "";
     }

    if (values.plec === "") {
        error.plec = "Wybierz płeć";
    } else {
        error.plec = "";
    }

    return error;
}

export default valid;