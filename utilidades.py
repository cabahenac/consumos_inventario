import json
from datetime import date, datetime, timedelta
from getpass import getpass


def ayer() -> date:
    '''Determina y devuelve la fecha de ayer para utilizarla como fecha de captura'''
    return date.today() - timedelta(1)


def dia_laboral(file_path: str = 'C:/Users/monterrey1/Documents/Projects/festivos.txt') -> datetime:
    '''Determina el día laboral más reciente y lo devuelve para utilizarlo como fecha de consumo'''

    # Cargar días festivos
    with open(file_path, 'r') as f:
        festivos = [datetime.strptime(line.rstrip(), '%Y-%m-%d') for line in f]

    # Determinar día laboral más reciente
    if ayer() in festivos:
        return ayer() - timedelta(2)
    elif ayer().weekday() == 6:
        return ayer() - timedelta(1)
    else:
        return ayer()


def read_json(file) -> dict:
    '''Lee un archivo JSON y devuelve un dictionario'''
    with open(file, 'r') as f:
        return json.load(f)


def read_camel_case(col_name: str) -> str:
    '''Extrae la segunda palabra de string en camelcase'''
    upper_chars = []
    for i, char in enumerate(col_name):
        if char.isupper():
            upper_chars.append(i)
    start = upper_chars[0]
    if len(upper_chars) > 1:
        end = upper_chars[1]
    else:
        end = None
    return col_name[start:end].lower()


def stand_by(msg: str):
    '''Pausa el proceso hasta recibir un input válido'''
    valid_input = False
    while not valid_input:
        input_ = str(input(msg)).upper()
        if input_ == 'S':
            exit()


class User:
    '''Contiene los datos de usuario'''

    def __init__(self) -> None:
        self.user_name: str = input('\nUsuario: ')
        self.password: str = getpass()
