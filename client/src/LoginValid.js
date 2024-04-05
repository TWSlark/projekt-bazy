function valid(values) {
    let error = {}
    const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-+=])[A-Za-z\d!@#$%^&*()-+=]{8,}$/;
    
    if (!emailRe.test(values.email)) {
        error.email = "Email jest nie poprawny"
    }
    else {
        error.email = "";
    }

    if (!passRe.test(values.password)) {
        error.password = "Hasło jest nie poprawne"
    }
    else {
        error.password = "";
    }

    return error;
}

export default valid;