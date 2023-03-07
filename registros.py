from __future__ import annotations

import os
from abc import ABC, abstractmethod
from datetime import date, datetime
from enum import Enum
from typing import Dict, List, Optional

import pandas as pd
import tabula

from utilidades import dia_laboral, read_json


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
