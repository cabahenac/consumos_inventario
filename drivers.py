from __future__ import annotations

from datetime import date
from enum import Enum
from time import sleep
from typing import List, NamedTuple, Optional, Protocol

import pandas as pd
from selenium.common.exceptions import (
    NoAlertPresentException,
    NoSuchElementException,
    NoSuchWindowException,
    SessionNotCreatedException,
    StaleElementReferenceException,
    WebDriverException,
)
from selenium.webdriver import Chrome, ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.wait import WebDriverWait

from utilidades import User, ayer, read_camel_case


class LIS(Protocol):
    """Representación básica de un Sistema de Información de Laboratorio"""

    ip: str
    body_id: str
    user_name_input_id: str
    password_input_id: str
    login_button_id: str
    form_id: str
    form_target_attr: str
    logout_anchortag_id: str


class QuimiosW:
    """Sistema de Información de Laboratorio QUIMIOS-W"""

    ip: str = "http://172.16.0.117/"
    body_id: str = "ctl00_MasterPageBodyTag"
    user_name_input_id: str = "Login1_UserName"
    password_input_id: str = "Login1_Password"
    login_button_id: str = "Login1_LoginButton"
    form_id: str = "aspnetForm"
    form_target_attr: str = "action"
    logout_anchortag_id = "ctl00_LinkCerrarSessión"


class ConsumosApp(QuimiosW):
    """Contiene la información relevante de la API"""

    uri: str = "Inventarios/ConsumoReacLabMasivo.aspx"
    fecha_captura_input_id: str = "ctl00_ContentMasterPage_txtDesdeB"
    equipo_select_id: str = "ctl00_ContentMasterPage_cmbEquipo"
    grupo_select_id: str = "ctl00_ContentMasterPage_cmbMesaOrdenac"
    buscar_button_id: str = "ctl00_ContentMasterPage_btnBuscarEstudio"
    data_table_id: str = "ctl00_ContentMasterPage_grdConsumo"
    rvos_col_id: str = "lblNombreEstudioGrd"
    save_button_id: str = "ctl00_ContentMasterPage_btnGuardaMasivo"


class Equipo(NamedTuple):
    """Representación básica de un equipo"""

    name: str
    grupo: Optional[str]


class Equipos(Enum):
    """Contenedor de equipos"""

    ARCHITECT = Equipo("ARCHITECT", "ARCHITECT DIA")
    ALINITY_C = Equipo("ALINITY C", None)


class Driver:
    """Driver básico con las funciones para revisar su propio estado y abrir
    el navegador, iniciar sesión y/o redireccionar a la API correcta"""

    def __init__(
        self,
        lis: LIS,
        user: User,
        maximized: bool = False,
        path: str = "chromedriver.exe",
    ) -> None:
        self.lis = lis
        self.user = user()
        self.options = ChromeOptions()
        if maximized:
            self.options.add_argument("--start-maximized")
        self.driver = Chrome(options=self.options)
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.get(self.lis.ip)

    def window_check(self) -> None:
        """Revisa si el navegador automatizado está asignado y
        si está abierto; si no, lo asigna y lo abre"""
        try:
            self.driver.find_element(By.TAG_NAME, "body")
        except NoSuchWindowException:
            self.driver = Chrome(options=self.options)
            self.wait = WebDriverWait(self.driver, 10)
            self.driver.get(self.lis.ip)

    def login_check(self) -> None:
        """Revisa si hay una sesión iniciada; si no, inicia sesión"""
        try:
            self.driver.find_element(By.ID, self.lis.logout_anchortag_id)
        except NoSuchElementException:
            self.driver.get(self.lis.ip)
            self.driver.find_element(By.ID, self.lis.user_name_input_id).send_keys(
                self.user.user_name
            )
            self.driver.find_element(By.ID, self.lis.password_input_id).send_keys(
                self.user.password
            )
            self.driver.find_element(By.ID, self.lis.login_button_id).click()

    def app_check(self) -> None:
        """Revisa si está en la página correcta de la aplicación; si no, abre la url correcta"""
        if (
            self.driver.find_element(By.ID, self.lis.form_id).get_attribute(
                self.lis.form_target_attr
            )
            != self.lis.ip + self.lis.uri
        ):
            self.driver.get(self.lis.ip + self.lis.uri)

    def driver_check(self) -> None:
        """Método de conveniencia"""
        self.window_check()
        self.login_check()
        self.app_check()


class DriverConsumos(Driver):
    """Navegador especializado en la captura de consumos"""

    def send_fecha_captura(self, fecha: Optional[date] = None) -> None:
        """Teclea la fecha de captura"""
        if fecha is None:  # Asign default value at run time instead of definition time
            fecha = ayer()
        (
            self.driver.find_element(By.ID, self.lis.fecha_captura_input_id).send_keys(
                fecha.strftime("%d%m%Y")
            )
        )

    def select_equipo(self, equipo: Equipo) -> None:
        """Selecciona el equipo de la lista desplegable"""
        Select(
            self.wait.until(
                EC.element_to_be_clickable((By.ID, self.lis.equipo_select_id))
            )
        ).select_by_visible_text(equipo.value.name)

    def select_grupo(self, equipo: Equipo) -> None:
        """Selecciona el grupo de la lista desplegable"""
        if equipo.value.grupo:
            Select(
                self.wait.until(
                    EC.element_to_be_clickable((By.ID, self.lis.grupo_select_id))
                )
            ).select_by_visible_text(equipo.value.grupo)

    def clic_buscar(self) -> None:
        """Hace clic en el botón buscar"""
        # Loop para evitar StaleElementException
        while True:
            try:
                self.driver.find_element(By.ID, self.lis.buscar_button_id).click()
                break
            except StaleElementReferenceException:
                continue
        # Wait para esperar a que cargue la página
        self.wait.until(EC.presence_of_element_located((By.ID, self.lis.data_table_id)))

    def buscar_equipo(self, equipo: Equipo) -> None:
        """Método de conveniencia"""
        self.select_equipo(equipo)
        self.select_grupo(equipo)
        self.clic_buscar()

    def get_rvos(self, starting_row: int = 2, max_num_rvos: int = 70) -> List[str]:
        """Escanea la página y devuelve una lista de los reactivos"""
        rvos = []
        for row in range(starting_row, max_num_rvos):
            try:
                element = self.driver.find_element(
                    By.ID,
                    f"{self.lis.data_table_id}_ctl{row:02}_{self.lis.rvos_col_id}",
                )
                rvos.append(element.text)
            except NoSuchElementException:
                pass
        return rvos

    def capturar_filas(
        self,
        df: pd.DataFrame,
        starting_row: int = 2,
        max_num_rvos: int = 70,
        sleep_time: int = 0,
    ):
        """Captura los consumos y devuelve información al usuario sobre las excepciones"""
        sin_consumo = (
            set()
        )  # Inicializa un set para almacenar los reactivos sin consumo

        sleep(sleep_time)

        for row in range(starting_row, max_num_rvos + 2):
            id = f"{self.lis.data_table_id}_ctl{row:02}_{self.lis.rvos_col_id}"
            rvo = ""
            try:  # Intenta encontrar la fila
                rvo = self.driver.find_element(By.ID, id).text
                # started = True # Después del primer éxito, cambiar el estado a iniciado
            except NoSuchElementException:
                pass

            if rvo not in df.index:  # Revisa si hay consumo
                sin_consumo.add(rvo)  # Si no, lo agrega al set
                continue  # Y continua con el siguiente reactivo

            self.capturar_cols(df, rvo, row)  # Ejecuta la captura

        # Al terminar el loop de filas, retroalimentar el usuario con la información relevante
        print(
            "\nIMPORTANTE: Los consumos ya capturados no se modifican. Si desea hacer cambios se deben hacer de manera manual."
        )
        if sin_consumo:
            print(
                f'\nNo se capturó {", ".join(sin_consumo)} debido a que no hay consumo.'
            )

    def capturar_cols(self, df: pd.DataFrame, rvo: str, row: int) -> None:
        cols_ya_capturadas = (
            []
        )  # Inicializa una lista para almacenar las columnas ya capturadas

        for col in df.columns:
            id = f"{self.lis.data_table_id}_ctl{row:02}_{col}"
            element = self.driver.find_element(By.ID, id)
            consumo = df.loc[rvo, col]

            # Extrae el valor capturado
            capturado = int(element.get_attribute("value"))
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
        """Hace clic en el botón guardar y luego cierra la ventana de alerta"""
        self.driver.find_element(By.ID, self.lis.save_button_id).click()
        while True:
            try:
                self.driver.switch_to.alert.accept()
                break
            except NoAlertPresentException:
                pass

    def clear_capturados(
        self,
        starting_row: int = 0,
        max_num_rvos: int = 70,
        sleep_time: int = 0,
        cols: List = [
            "txtControlCapMGrd",
            "txtCalibracionCapMGrd",
            "txtPacientes",
            "txtRepeticiones",
            "txtCancelacionCapMGrd",
        ],
    ) -> None:
        sleep(sleep_time)

        for row in range(starting_row, max_num_rvos + 2):
            for col in cols:
                id = f"{self.lis.data_table_id}_ctl{row:02}_{col}"
                try:
                    element = self.driver.find_element(By.ID, id)
                except NoSuchElementException:
                    pass
                else:
                    element.clear()
                    element.send_keys("0")
