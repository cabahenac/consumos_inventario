from __future__ import annotations

import json
import os
import sys
from abc import ABC, abstractmethod
from datetime import date, datetime, timedelta
from enum import Enum
from getpass import getpass
from time import sleep
from typing import Dict, List, NamedTuple, Optional, Protocol

import pandas as pd
import tabula
from selenium.common.exceptions import (NoAlertPresentException,
                                        NoSuchElementException,
                                        NoSuchWindowException,
                                        StaleElementReferenceException)
from selenium.webdriver import Chrome, ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.wait import WebDriverWait


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


class TipoReg(Enum):
    AMS_IM = 'IM'
    AMS_BQ = 'BQ'
    BIT_CAL = 'Aceptación'
    BIT_EX = 'Excepciones'
    BIT_CANC = 'Disposición'


class RegistroConsumos(ABC):
    '''Representación de un registro de consumos'''

    def __init__(self, tipo: TipoReg, *,
                 fecha: datetime,
                 col_rvos: str,
                 rvos_json: str,
                 cols_json: str) -> None:

        if fecha is None:
            self.fecha = dia_laboral()
        else:
            self.fecha = fecha

        self.tipo = tipo.value
        self.col_rvos = col_rvos
        self.rvos_json = rvos_json
        self.cols_json = cols_json
        self.rvos: Dict = read_json(self.rvos_json)[self.__class__.__name__]
        self.cols: Dict = read_json(self.cols_json)[self.tipo]
        self.path = None

    @abstractmethod
    def read(self):
        '''Lee el archivo y almacena la información relevante en un DataFrame como atributo de clase'''

    @abstractmethod
    def transform(self):
        '''Transforma el DataFrame y lo devuelve una forma estandarizada para ser concatenado'''

    def rvos_check(self) -> None:
        '''Revisa si la primera columna contiene los nombres de reactivo'''
        # Inicializar contadores y contenedores
        found_keys = 0
        missing_keys = 0
        missing_keys_list = []

        # Loop para buscar en la primera columna (designada como columna de nombre de reactivo)
        for rvo in self.df[self.col_rvos]:
            if rvo in self.rvos:
                found_keys += 1
            else:
                missing_keys += 1
                missing_keys_list.append(rvo)

        # Revisar si la columna contiene nombres de reactivo
        if found_keys == 0:
            print(
                f'La columna {self.df[self.col_rvos].name} del archivo {self.path} no contiene nombres de reactivos; por favor, revísalo')
            exit()

        # Revisar si el traductor está actualizado
        while missing_keys > 0:  # Interacción con el usuario en caso de que no se encuentren datos
            input_ = str(input(
                f'No se encontraron {missing_keys} reactivos {", ".join(missing_keys_list)}. Actualiza el diccionario de reactivos. ¿Continuar? S/N ')).upper()
            if input_ == 'S':
                self.rvos: dict = read_json(self.rvos_json)[
                    self.__class__.__name__]
                break
            elif input_ == 'N':
                exit()


class ReporteAMS(RegistroConsumos):

    def __init__(self, tipo: TipoReg, *,
                 fecha: Optional[datetime] = None,
                 col_rvos: str = 'lblNombreEstudioGrd',
                 rvos_json: str = 'C:/Users/monterrey1/Documents/Projects/rvos.json',
                 cols_json: str = 'C:/Users/monterrey1/Documents/Projects/cols.json',
                 folder: str = 'C:/Users/monterrey1/Documents/Inventarios/',
                 file_regex: str = 'AMS ') -> None:

        super().__init__(tipo, fecha=fecha, col_rvos=col_rvos,
                         rvos_json=rvos_json, cols_json=cols_json)
        self.path = f'{folder}{file_regex}{self.tipo} {date.strftime(self.fecha, "%Y-%m-%d")}.pdf'
        print(f'Cargando {self.__class__.__name__} {self.tipo}')
        self.read().transform()

    def read(self) -> ReporteAMS:
        try:  # Leer PDF y almacenar las tablas en una lista de DatFrames
            dfs = tabula.read_pdf(self.path, pages=1, stream=True, pandas_options={
                                  'columns': self.cols})
            while not dfs:  # Interacción con el usuario en caso de que no se encuentren datos
                input_ = str(input(
                    f'No se encontraron datos en el archivo. ¿Es el archivo correcto? S/N ')).upper()
                if input_ == 'S':
                    break
                elif input_ == 'N':
                    exit()
            self.df = dfs[0]  # Almacena el primer DataFrame
            return self  # Se devuelve a sí mismo para poder concatenar métodos
        except FileNotFoundError:
            raise FileNotFoundError(
                f'Hay un problema con el archivo {self.path}; por favor, revísalo')

    def transform(self, manual_edits='manual_edits', w='numbers', wo='txtPacientes') -> ReporteAMS:
        self.df = self.df[self.cols]
        self.rvos_check()
        include_manual_edits = self.manual_edits(manual_edits)
        self.df[self.col_rvos] = self.df[self.col_rvos].map(self.rvos)
        if include_manual_edits:  # Invierte las columnas de pacientes sin ediciones manuales y pacientes con ediciones manuales
            self.df = self.df.rename({w: wo, wo: w}, axis=1)
        self.df = self.df.drop([manual_edits, w], axis=1)
        return self  # Se devuelve a sí mismo para poder concatenar métodos

    def manual_edits(self, manual_edits='manual_edits') -> bool:
        '''Revisa si hay captura de resultados manuales y pregunta al usuario qué hacer con ellos'''
        filtered_df = self.df[self.df[manual_edits] !=
                              0]  # Filtra solo los reactivos con ediciones manuales
        manual_edits = filtered_df[manual_edits]
        rvos = filtered_df[self.col_rvos]
        # Genera una lista de strings que contenga el resumen de las ediciones manuales
        summary = [f'{manual_edit} {rvo}' for manual_edit,
                   rvo in zip(manual_edits, rvos)]
        if manual_edits.empty:
            return False
        while True:  # Preguntar si se ignoran las ediciones manuales
            input_ = str(input(
                f'Se ignorarán {manual_edits.sum()} ediciones manuales ({", ".join(summary)}) ¿Continuar? S/N: ')).upper()
            if input_ == 'S':
                return False  # Si se elije continuar devuelve Falso y termina la función
            if input_ == 'N':
                break
        while True:  # Si se elije No, preguntar si se toman en cuenta las ediciones manuales
            input_ = str(
                input('¿Tomar en cuenta las ediciones manuales? S/N: ')).upper()
            if input_ == 'S':
                return True  # Si se elije Sí, devuelve Verdadero y termina la función
            if input_ == 'N':
                return False  # Si se elije No, devuelve Falso y termina la función


class Bitacora(RegistroConsumos):

    def __init__(self, tipo: TipoReg, *,
                 fecha: Optional[datetime] = None,
                 col_rvos: str = 'lblNombreEstudioGrd',
                 rvos_json: str = 'C:/Users/monterrey1/Documents/Projects/rvos.json',
                 cols_json: str = 'C:/Users/monterrey1/Documents/Projects/cols.json',
                 folder: str = 'C:/Users/monterrey1/Downloads/',
                 file_regex: str = 'Bitácoras de reactivos') -> None:

        super().__init__(tipo, fecha=fecha, col_rvos=col_rvos,
                         rvos_json=rvos_json, cols_json=cols_json)
        if folder[-1] != '/':
            folder += '/'
        self.path = self.get_path(folder, file_regex)
        print(f'Cargando {file_regex} ({self.tipo})')
        self.read().transform()

    def read(self) -> Bitacora:
        for header in range(5):  # Buscar la fila de encabezado
            # Almacenar el Dataframe
            self.df = pd.read_excel(
                self.path, sheet_name=self.tipo, header=header)
            for col in self.cols:  # Revisar que estén todas las columnas
                if col not in self.df.columns:
                    break  # Si no se encuentra alguna columna, salir del loop interior
            else:  # Si no se interrupió el loop interior, quiere decir que se encontraron todas las columnas
                # Salir del loop exterior (el Dataframe correcto ya está almacenado)
                break
        return self  # Se devuelve a sí mismo para poder concatenar métodos

    def transform(self) -> Bitacora:
        # Filtrar y renombrar columnas
        self.df = self.df[list(self.cols)]
        self.df = self.df.rename(self.cols, axis=1)
        # Renombrar reactivos
        self.rvos_check()
        self.df[self.col_rvos] = self.df[self.col_rvos].map(self.rvos)
        # Filtrar por fecha de consumo
        criteria = pd.Timestamp(self.fecha)
        self.df = self.df[self.df.fecha == criteria]
        self.df = self.df.drop('fecha', axis=1)
        return self  # Se devuelve a sí mismo para poder concatenar métodos

    def get_files(self, folder, file_regex) -> List[tuple[str, float]]:
        '''Devuelve una lista de tuplas que contengan: (nombre de archivo, fecha/hora de creación)'''
        return [(file, os.path.getctime(folder + file)) for file in os.listdir(folder) if file.startswith(file_regex)]

    def get_path(self, folder, file_regex) -> str:
        '''Devuelve la ruta del archivo más reciente'''
        # Revisar si hay en la carpeta algún archivo que empieze con el nombre de archivo buscado
        if not (files := self.get_files(folder, file_regex)):
            raise FileNotFoundError(
                f'No descargaste el archivo {file_regex}.xlsx')

        # Ordenar, filtar y desempacar los datos del archivo más reciente
        file, created = sorted(files, key=lambda x: x[1], reverse=True)[0]

        # Convertir el timestamp de la fecha/hora de creación en un objeto date
        created = date.fromtimestamp(created)

        # Revisar si se descargó el archivo hoy
        if created < date.today():
            raise FileNotFoundError(
                f'No descargaste el archivo {file_regex}.xlsx más reciente')

        # Regresa la ruta del archivo más reciente
        return folder + file


class Organizador:

    def __init__(self, registros: List[RegistroConsumos], *, col_rvos: str = 'lblNombreEstudioGrd') -> None:
        '''Genera un Dataframe con los productos del método .read().transform() de cada uno de los registros'''
        self.registros = registros
        self.col_rvos = col_rvos
        self.read().transform()

    def read(self) -> Organizador:
        self.df = pd.DataFrame()
        for registro in self.registros:
            self.df = pd.concat([self.df, registro.df])
        return self

    def transform(self) -> Organizador:
        self.df = self.df.groupby(self.col_rvos).sum().fillna(0).astype(int)
        return self


class LIS(Protocol):
    '''Representación básica de un Sistema de Información de Laboratorio'''
    ip: str
    body_id: str
    user_name_input_id: str
    password_input_id: str
    login_button_id: str
    form_id: str
    form_target_attr: str
    logout_anchortag_id: str


class QuimiosW:
    '''Sistema de Información de Laboratorio QUIMIOS-W'''
    ip: str = 'http://172.16.0.117/'
    body_id: str = 'ctl00_MasterPageBodyTag'
    user_name_input_id: str = 'Login1_UserName'
    password_input_id: str = 'Login1_Password'
    login_button_id: str = 'Login1_LoginButton'
    form_id: str = 'aspnetForm'
    form_target_attr: str = 'action'
    logout_anchortag_id = 'ctl00_LinkCerrarSessión'


class ConsumosApp(QuimiosW):
    '''Contiene la información relevante de la API'''
    uri: str = 'Inventarios/ConsumoReacLabMasivo.aspx'
    fecha_captura_input_id: str = 'ctl00_ContentMasterPage_txtDesdeB'
    equipo_select_id: str = 'ctl00_ContentMasterPage_cmbEquipo'
    grupo_select_id: str = 'ctl00_ContentMasterPage_cmbMesaOrdenac'
    buscar_button_id: str = 'ctl00_ContentMasterPage_btnBuscarEstudio'
    data_table_id: str = 'ctl00_ContentMasterPage_grdConsumo'
    rvos_col_id: str = 'lblNombreEstudioGrd'
    save_button_id: str = 'ctl00_ContentMasterPage_btnGuardaMasivo'


class Equipo(NamedTuple):
    '''Representación básica de un equipo'''
    name: str
    grupo: Optional[str]


class Equipos(Enum):
    '''Contenedor de equipos'''
    ARCHITECT = Equipo('ARCHITECT', 'ARCHITECT DIA')
    ALINITY_C = Equipo('ALINITY C', None)


class Driver:
    '''Driver básico con las funciones para revisar su propio estado y abrir 
    el navegador, iniciar sesión y/o redireccionar a la API correcta'''

    def __init__(self, lis: LIS, user: User, maximized: bool = False,
                 path: str = 'chromedriver.exe') -> None:
        self.lis = lis
        self.user = user()
        self.options = ChromeOptions()
        if maximized:
            self.options.add_argument('--start-maximized')
        self.driver = Chrome(options=self.options, executable_path=path)
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.get(self.lis.ip)

    def window_check(self) -> None:
        '''Revisa si el navegador automatizado está asignado y 
        si está abierto; si no, lo asigna y lo abre'''
        try:
            self.driver.find_element_by_tag_name('body')
        except NoSuchWindowException:
            self.driver = Chrome(options=self.options)
            self.wait = WebDriverWait(self.driver, 10)
            self.driver.get(self.lis.ip)

    def login_check(self) -> None:
        '''Revisa si hay una sesión iniciada; si no, inicia sesión'''
        try:
            self.driver.find_element_by_id(self.lis.logout_anchortag_id)
        except NoSuchElementException:
            self.driver.get(self.lis.ip)
            self.driver.find_element_by_id(
                self.lis.user_name_input_id).send_keys(self.user.user_name)
            self.driver.find_element_by_id(
                self.lis.password_input_id).send_keys(self.user.password)
            self.driver.find_element_by_id(self.lis.login_button_id).click()

    def app_check(self) -> None:
        '''Revisa si está en la página correcta de la aplicación; si no, abre la url correcta'''
        if self.driver.find_element_by_name(self.lis.form_id).get_attribute(self.lis.form_target_attr) != self.lis.ip + self.lis.uri:
            self.driver.get(self.lis.ip + self.lis.uri)

    def driver_check(self) -> None:
        '''Método de conveniencia'''
        self.window_check()
        self.login_check()
        self.app_check()


class DriverConsumos(Driver):
    '''Navegador especializado en la captura de consumos'''

    def send_fecha_captura(self, fecha: Optional[date] = None) -> None:
        '''Teclea la fecha de captura'''
        if fecha is None:  # Asign default value at run time instead of definition time
            fecha = ayer()
        (
            self.driver
            .find_element_by_id(self.lis.fecha_captura_input_id)
            .send_keys(fecha.strftime('%d%m%Y'))
        )

    def select_equipo(self, equipo: Equipo) -> None:
        '''Selecciona el equipo de la lista desplegable'''
        Select(
            self.wait
            .until(EC.element_to_be_clickable((By.ID, self.lis.equipo_select_id)))
        ).select_by_visible_text(equipo.value.name)

    def select_grupo(self, equipo: Equipo) -> None:
        '''Selecciona el grupo de la lista desplegable'''
        if equipo.value.grupo:
            Select(
                self.wait
                .until(EC.element_to_be_clickable((By.ID, self.lis.grupo_select_id)))
            ).select_by_visible_text(equipo.value.grupo)

    def clic_buscar(self) -> None:
        '''Hace clic en el botón buscar'''
        # Loop para evitar StaleElementException
        while True:
            try:
                self.driver.find_element_by_id(
                    self.lis.buscar_button_id).click()
                break
            except StaleElementReferenceException:
                continue
        # Wait para esperar a que cargue la página
        self.wait.until(EC.presence_of_element_located(
            (By.ID, self.lis.data_table_id)))

    def buscar_equipo(self, equipo: Equipo) -> None:
        '''Método de conveniencia'''
        self.select_equipo(equipo)
        self.select_grupo(equipo)
        self.clic_buscar()

    def get_rvos(self, starting_row: int = 2, max_num_rvos: int = 70) -> List[str]:
        '''Escanea la página y devuelve una lista de los reactivos'''
        rvos = []
        for row in range(starting_row, max_num_rvos):
            try:
                element = self.driver.find_element_by_id(
                    f'{self.lis.data_table_id}_ctl{row:02}_{self.lis.rvos_col_id}')
                rvos.append(element.text)
            except NoSuchElementException:
                pass
        return rvos

    def capturar_filas(self, df: pd.DataFrame, starting_row: int = 2, max_num_rvos: int = 70, sleep_time: int = 0):
        '''Captura los consumos y devuelve información al usuario sobre las excepciones'''
        sin_consumo = set()  # Inicializa un set para almacenar los reactivos sin consumo
        
        sleep(sleep_time)

        for row in range(starting_row, max_num_rvos + 2):
            id = f'{self.lis.data_table_id}_ctl{row:02}_{self.lis.rvos_col_id}'
            rvo = ''
            try: # Intenta encontrar la fila
                rvo = self.driver.find_element_by_id(id).text
                # started = True # Después del primer éxito, cambiar el estado a iniciado
            except NoSuchElementException:
                pass

            if rvo not in df.index: # Revisa si hay consumo
                sin_consumo.add(rvo) # Si no, lo agrega al set
                continue            # Y continua con el siguiente reactivo
            
            self.capturar_cols(df, rvo, row) # Ejecuta la captura

        # Al terminar el loop de filas, retroalimentar el usuario con la información relevante
        print('\nIMPORTANTE: Los consumos ya capturados no se modifican. Si desea hacer cambios se deben hacer de manera manual.')
        if sin_consumo:
            print(f'\nNo se capturó {", ".join(sin_consumo)} debido a que no hay consumo.')


    def capturar_cols(self, df: pd.DataFrame, rvo: str, row: int) -> None:
        cols_ya_capturadas = []  # Inicializa una lista para almacenar las columnas ya capturadas

        for col in df.columns:
            id = f'{self.lis.data_table_id}_ctl{row:02}_{col}'
            element = self.driver.find_element_by_id(id)
            consumo = df.loc[rvo, col]

            # Extrae el valor capturado
            capturado = int(element.get_attribute('value'))
            if capturado:  # Si ya hay un valor capturado, anexar la columna a la lista
                cols_ya_capturadas.append(read_camel_case(col))
                continue  # Continuar con el siguiente reactivo

            if consumo:  # Si hay consumo, capturarlo
                element.clear()
                element.send_keys(str(consumo))

        # Al terminar el loop de columnas, anexar el string del reactivo y las columnas ya capturadas
        if cols_ya_capturadas:
            print(f'{rvo}: {", ".join(cols_ya_capturadas)} ya estaban capturados.')


    def save(self) -> None:
        '''Hace clic en el botón guardar y luego cierra la ventana de alerta'''
        self.driver.find_element_by_id(self.lis.save_button_id).click()
        while True:
            try:
                self.driver.switch_to.alert.accept()
                break
            except NoAlertPresentException:
                pass

    def clear_capturados(self, starting_row: int = 0, max_num_rvos: int = 70, sleep_time: int = 0,
        cols: List = [
            "txtControlCapMGrd",
            "txtCalibracionCapMGrd",
            "txtPacientes",
            "txtRepeticiones",
            "txtCancelacionCapMGrd"
        ]) -> None:

        sleep(sleep_time)

        for row in range(starting_row, max_num_rvos + 2):
            for col in cols:
                id = f'{self.lis.data_table_id}_ctl{row:02}_{col}'
                try:
                    element = self.driver.find_element_by_id(id)
                except NoSuchElementException:
                    pass
                else:
                    element.clear()
                    element.send_keys('0')


def main(*, clear_mode=False) -> None:
    '''Ejecuta el proceso estándar de captura actual'''
    if not clear_mode:
        reg = Organizador([
            ReporteAMS(TipoReg.AMS_BQ),
            ReporteAMS(TipoReg.AMS_IM),
            Bitacora(TipoReg.BIT_CAL),
            Bitacora(TipoReg.BIT_CANC),
            Bitacora(TipoReg.BIT_EX),
        ])
    driver = DriverConsumos(ConsumosApp, User)
    driver.driver_check()
    driver.send_fecha_captura()
    driver.buscar_equipo(Equipos.ALINITY_C)
    if not clear_mode:
        driver.capturar_filas(reg.df, max_num_rvos=1)
    else:
        driver.clear_capturados(max_num_rvos=1)
    driver.save()
    driver.buscar_equipo(Equipos.ARCHITECT)
    if not clear_mode:
        driver.capturar_filas(reg.df, sleep_time=5)
    else:
        driver.clear_capturados(sleep_time=5)
    driver.save()


if __name__ == '__main__':
    if '-c' in sys.argv:
        print('\nIniciando en modo limpieza')
        main(clear_mode=True)
    else:
        main(clear_mode=False)
    stand_by('\nEscribe "S" para salir \n')