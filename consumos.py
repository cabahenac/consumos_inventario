from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver import ChromeOptions
from selenium.common.exceptions import StaleElementReferenceException
from datetime import datetime
from datetime import timedelta
import pandas as pd
import logging
import tabula
import os
import pdb

logger = logging.getLogger(__name__)
logger.setLevel('DEBUG')

stream_formatter = logging.Formatter('%(message)s')
stream_handler = logging.StreamHandler()
stream_handler.setFormatter(stream_formatter)

logger.addHandler(stream_handler)

class InventoryManager:
    
    green_flag = False
    options = ChromeOptions()
    options.add_argument('--start-maximized')

    quimios_names = {
        'ACVALPMT': 'AC. VALP',
        'AFP_MTY': 'AFP', 
        'BHCGMTY': 'BETA-HCG', 
        'CA125MTY': 'CA-125', 
        'CA153MTY': 'CA-153', 
        'CA199MTY': 'CA-199', 
        'CEA2MTY': 'CEA2',
        'CORSMTY': 'CORTISOL-OR', 
        'ESTTOMTY': 'ESTROGENOS', 
        'E2MTY': 'E2', 
        'FERR_MTY': 'FERR', 
        'FSHMTY': 'FSH', 
        'INSULMTY': 'INSULINA', 
        'ITLMTY': 'ITL', 
        'LHMTY': 'LH', 
        'PROGMTY': 'PROG', 
        'PROLMTY': 'PROL', 
        'PSALIBMT': 'PSA-LIBRE', 
        'PSATOTMT': 'PSA-TOTAL', 
        'TETOTMTY': 'TEST-TOTAL', 
        'TSHMTY': 'TSH', 
        'TUMTY': 'TU', 
        'T3LIBMTY': 'T3-LIBRE', 
        'T3TOTMTY': 'T3-TOTAL', 
        'T4LIBMTY': 'T4-LIBRE', 
        'T4TOTMTY': 'T4-TOTAL', 
        'YODOPRMT': 'YODO PROT',
        'ACURIMTY': 'AC. URICO-S', 
        'ALBMTY': 'ALBUMINA-SUERO', 
        'AMIMTY': 'AMILASA-S', 
        'BILIDMTY': 'BILIRR-DIR', 
        'BILIIMTY': 'BILIRR-IND', 
        'BILITMTY': 'BILIRR-TOT', 
        'CAPFIJMT': 'TIBC', 
        'CA-SMTY': 'Ca-S', 
        'CLOMTY': 'CLORO-S', 
        'COLHMTY': 'COLEST-HDL', 
        'COLLMTY': 'COLEST-LDL', 
        'COLTMTY': 'COLEST-TOT', 
        'COLVLMTY': 'COLEST-VLDL', 
        'CREAMTY': 'CREATININA-S', 
        'C3_MTY': 'C3', 
        'C4_MTY': 'C4', 
        '%DESATMT': '%DESAT', 
        'DHLMTY': 'DHL', 
        'FESMTY': 'FE SERICO', 
        'FOSFAMTY': 'FOSF-ALCAL', 
        'FOSFMTY': 'FOSFOR-S', 
        'GGTPMTY': 'GGTP', 
        'GLOBULMT': 'GLOB', 
        'GLUMTY': 'GLUCOSA-S', 
        'IgA_MTY': 'IgA', 
        'IgG_MTY': 'IgG', 
        'IgM_MTY': 'IgM', 
        'IgE_MTY': 'IgE', 
        'INDICMTY': 'IND-ATERO', 
        'LIPASAMT': 'LIPASA', 
        'MGSMTY': 'Mg-SERICO', 
        'NITROMTY': 'NITROG URE', 
        'PCRCUMTY': 'PCR-ULTRA', 
        'PCRULMTY': 'PCR-ULTRA', 
        'POTMTY': 'CLORO-S', 
        'PRTTSMTY': 'PROT-TOT-S', 
        'REL A/GM': 'RELA/G', 
        'RELBUNCM': 'RELBUN/CREA', 
        'SODMTY': 'CLORO-S', 
        'TGOMTY': 'TGO', 
        'TGPMTY': 'TGP', 
        'TRF_MTY': 'TRF', 
        'TRIGLMTY': 'TRIGLICERIDOS', 
        'UIBCMTY': 'CAP. FIJ. Fe', 
        'UREMTY': 'UREA', 
        'HBGLMTY': 'Hb-GLIC', 
        'DIMEMTY': 'DIMERO D'
    }
    
    bitacoras_names = {
        'ÁCIDO VALPROICO': 'AC. VALP',
        'AFP': 'AFP', 
        'BHCG': 'BETA-HCG', 
        'CA 125': 'CA-125', 
        'CA 15-3': 'CA-153', 
        'CA 19-9': 'CA-199', 
        'CEA': 'CEA2',
        'CORTISOL': 'CORTISOL-OR',
        'ESTRADIOL': 'E2', 
        'FERRITINA': 'FERR', 
        'FSH': 'FSH', 
        'INSULINA': 'INSULINA', 
        'LH': 'LH', 
        'PROGESTERONA': 'PROG', 
        'PROLACTINA': 'PROL', 
        'PSA LIBRE': 'PSA-LIBRE', 
        'PSA TOTAL': 'PSA-TOTAL', 
        'TESTOSTERONA': 'TEST-TOTAL', 
        'TSH': 'TSH', 
        'T-UPTAKE': 'TU', 
        'T3 LIBRE': 'T3-LIBRE', 
        'T3 TOTAL': 'T3-TOTAL', 
        'T4 LIBRE': 'T4-LIBRE', 
        'T4 TOTAL': 'T4-TOTAL', 
        'ÁCIDO ÚRICO': 'AC. URICO-S', 
        'ALBÚMINA': 'ALBUMINA-SUERO', 
        'AMILASA': 'AMILASA-S', 
        'BILIRRUBINA DIRECTA': 'BILIRR-DIR',  
        'BILIRRUBINA TOTAL': 'BILIRR-TOT',
        'CALCIO': 'Ca-S', 
        'CLORO': 'CLORO-S', 
        'HDL': 'COLEST-HDL', 
        'COLESTEROL': 'COLEST-TOT', 
        'CREATININA': 'CREATININA-S', 
        'COMPLEMENTO C3': 'C3', 
        'COMPLEMENTO C4': 'C4',
        'LDH': 'DHL', 
        'HIERRO': 'FE SERICO', 
        'FOSFATASA ALCALINA': 'FOSF-ALCAL', 
        'FÓSFORO': 'FOSFOR-S', 
        'GGT': 'GGTP',  
        'GLUCOSA': 'GLUCOSA-S', 
        'IGA': 'IgA', 
        'IGG': 'IgG', 
        'IGM': 'IgM', 
        'IGE': 'IgE', 
        'LIPASA': 'LIPASA', 
        'MAGNESIO': 'Mg-SERICO', 
        'NITRÓGENO UREICO': 'NITROG URE', 
        'PROTEÍNA C REACTIVA CUANTITATIVA': 'PCR-ULTRA', 
        'PROTEÍNA C REACTIVA ULTRASENSIBLE': 'PCR-ULTRA', 
        'POTASIO': 'CLORO-S', 
        'PROTEÍNAS TOTALES': 'PROT-TOT-S', 
        'SODIO': 'CLORO-S', 
        'AST': 'TGO', 
        'ALT': 'TGP', 
        'TRANSFERRINA': 'TRF', 
        'TRIGLICÉRIDOS': 'TRIGLICERIDOS', 
        'UIBC': 'CAP. FIJ. Fe',
        'HEMOGLOBINA A1C': 'Hb-GLIC', 
        'DÍMERO D': 'DIMERO D'
    }
    
    def __init__(self, day=None, month=None, year=None):
        
        if day is None and datetime.today().strftime('%A') != 'Monday':
            self.day = (datetime.today() - timedelta(1)).day
        elif day is None and datetime.today().strftime('%A') == 'Monday':
            self.day = (datetime.today() - timedelta(2)).day
        else:
            self.day = day
        
        if month is None and datetime.today().strftime('%A') != 'Monday':
            self.month = (datetime.today() - timedelta(1)).month
        elif month is None and datetime.today().strftime('%A') == 'Monday':
            self.month = (datetime.today() - timedelta(2)).month
        else:
            self.month = month
        
        if year is None and datetime.today().strftime('%A') != 'Monday':
            self.year = (datetime.today() - timedelta(1)).year
        elif year is None and datetime.today().strftime('%A') == 'Monday':
            self.year = (datetime.today() - timedelta(2)).year
        else:
            self.year = year
            
        self.datetime_captura = datetime.today() - timedelta(1)
        self.fecha_captura = datetime(self.datetime_captura.year, self.datetime_captura.month, self.datetime_captura.day)
        self.green_flag_ams_im = False
        self.green_flag_ams_bq = False
        self.green_flag_bitacoras = False
        self.green_flag_bitacoras_descargadas_hoy = False
        self.selector_prefix = 'ctl00_ContentMasterPage_grdConsumo_ctl'
        
    def login(self):
        self.driver = webdriver.Chrome(options=self.options, executable_path='/Users/monterrey1/Documents/Muestras/chromedriver')
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.get('http://172.16.0.117/')
        self.driver.find_element_by_id('Login1_UserName').send_keys('cbahena')
        self.driver.find_element_by_id('Login1_Password').send_keys('alpe58')
        self.driver.find_element_by_id('Login1_LoginButton').click()
        self.driver.get('http://172.16.0.117/Inventarios/ConsumoReacLabMasivo.aspx')
        
        (self.driver.find_element_by_id('ctl00_ContentMasterPage_txtDesdeB')
         .send_keys(f'{self.fecha_captura.day:02}{self.fecha_captura.month:02}{self.fecha_captura.year}')
        )
    
    def go_to_alinity(self):
        (Select(self.driver.find_element_by_id('ctl00_ContentMasterPage_cmbEquipo'))
         .select_by_visible_text('ALINITY C'))
        
        while True:
            try:
                self.driver.find_element_by_id('ctl00_ContentMasterPage_btnBuscarEstudio').click()
                break
            except StaleElementReferenceException:
                continue
    
    def go_to_arch(self):
        (Select(self.wait.until(EC.element_to_be_clickable(('id', 'ctl00_ContentMasterPage_cmbEquipo'))))
         .select_by_visible_text('ARCHITECT'))

        (Select(self.wait.until(EC.element_to_be_clickable(('id', 'ctl00_ContentMasterPage_cmbMesaOrdenac'))))
         .select_by_visible_text('ARCHITECT DIA'))
        
        while True:
            try:
                self.driver.find_element_by_id('ctl00_ContentMasterPage_btnBuscarEstudio').click()
                break
            except StaleElementReferenceException:
                continue
    
    def get_ams_im(self):
        try:
            self.ams_im = tabula.read_pdf(f'C:/Users/monterrey1/Documents/Inventarios/AMS IM {self.year}-{self.month:02}-{self.day:02}.pdf', pages=1, stream=True, 
                                          pandas_options={'columns': ['_lblNombreEstudioGrd',
                                                                      'Numbers',
                                                                      '_txtRepeticiones',
                                                                      'Manual edits',
                                                                      '_txtControlCapMGrd', 
                                                                      '_txtPacientes',
                                                                     ]
                                                         }
                                         )[0]
            self.green_flag_ams_im = True
        except Exception:
            logger.critical(f'\nHay un problema con el archivo AMS IM {self.year}-{self.month:02}-{self.day:02}.pdf; por favor, revísalo')
            
    def get_ams_bq(self):
        try:
            self.ams_bq = tabula.read_pdf(f'C:/Users/monterrey1/Documents/Inventarios/AMS BQ {self.year}-{self.month:02}-{self.day:02}.pdf', pages=1, stream=True, 
                                          pandas_options={'columns': ['_lblNombreEstudioGrd',
                                                                      'Numbers',
                                                                      '_txtRepeticiones',
                                                                      'Manual edits',
                                                                      '_txtControlCapMGrd', 
                                                                      '_txtPacientes',
                                                                     ]
                                                         }
                                         )[0]
            self.green_flag_ams_bq = True
        except Exception:
            logger.critical(f'\nHay un problema con el archivo AMS BQ {self.year}-{self.month:02}-{self.day:02}.pdf; por favor, revísalo')
        
    def get_bitacoras(self):
        os.chdir('/Users/monterrey1/Downloads')
        df_dict = {'file': [], 'created': []}
        
        try:
            for file in os.listdir():
                df_dict['file'].append(file)
                df_dict['created'].append(os.path.getctime(file))

            bitacoras_path = (pd.DataFrame(df_dict)
                [lambda df: df.file.str.contains('Bitácoras de reactivos')]
                .nlargest(1, 'created')
                .iloc[0,0]
            )
            last_created = (pd.DataFrame(df_dict)
                [lambda df: df.file.str.contains('Bitácoras de reactivos')]
                .nlargest(1, 'created')
                .iloc[0,1]
            )
            self.green_flag_bitacoras = True
            if datetime.fromtimestamp(last_created) >= datetime(datetime.today().year, datetime.today().month, datetime.today().day):
                self.green_flag_bitacoras_descargadas_hoy = True
            else:
                logger.critical(f'\nNo descargaste el archivo Bitácoras de reactivos.xlsx más reciente; por favor, revísalo')
        except Exception:
            logger.critical(f'\nHay un problema con el archivo Bitácoras de reactivos.xlsx; por favor, revísalo')
        
        try:
            self.aceptacion = (pd.read_excel('/Users/monterrey1/Downloads/' + bitacoras_path, sheet_name='Aceptación', header=1, parse_dates=[0])
                [['FECHA', 'ENSAYO', 'EN CALIBRACIÓN']]
                .rename({'FECHA': 'fecha', 'ENSAYO': '_lblNombreEstudioGrd', 'EN CALIBRACIÓN': '_txtCalibracionCapMGrd'}, axis=1)
                [lambda df: df.fecha.eq(datetime(self.year, self.month, self.day))]
                .drop('fecha', axis=1)
                .assign(_lblNombreEstudioGrd = lambda df: df._lblNombreEstudioGrd.map(self.bitacoras_names),
                       _txtCalibracionCapMGrd = lambda df: df._txtCalibracionCapMGrd.astype(int)
                       )
                .groupby('_lblNombreEstudioGrd')
                .sum()
            )
        except Exception:
            self.green_flag_bitacoras = False
            logger.critical(f'\nHay un problema con la bitácora de aceptación; por favor, revísala')
        
        try:
            self.disposicion = (pd.read_excel('/Users/monterrey1/Downloads/' + bitacoras_path, sheet_name='Disposición', parse_dates=[0])
                [['FECHA', 'PRODUCTO', 'NÚMERO DE PRUEBAS MERMADAS']]
                .rename({'FECHA': 'fecha', 'PRODUCTO': '_lblNombreEstudioGrd', 'NÚMERO DE PRUEBAS MERMADAS': '_txtCancelacionCapMGrd'}, axis=1)
                [lambda df: df.fecha.eq(datetime(self.year, self.month, self.day))]
                .drop('fecha', axis=1)
                .assign(_lblNombreEstudioGrd = lambda df: df._lblNombreEstudioGrd.map(self.bitacoras_names),
                       _txtCancelacionCapMGrd = lambda df: df._txtCancelacionCapMGrd.astype(int)
                       )
                .groupby('_lblNombreEstudioGrd')
                .sum()
            )
        except Exception:
            self.green_flag_bitacoras = False
            logger.critical(f'\nHay un problema con la bitácora de disposición; por favor, revísala')
        
        try:
            self.excepciones = (pd.read_excel('/Users/monterrey1/Downloads/' + bitacoras_path, sheet_name='Excepciones', parse_dates=[0])
                [['FECHA', 'ENSAYO', 'CC', 'Cal', 'Px', 'Rep', 'Canc']]
                .rename({'FECHA': 'fecha', 
                         'ENSAYO': '_lblNombreEstudioGrd', 
                         'CC': '_txtControlCapMGrd', 
                         'Cal': '_txtCalibracionCapMGrd', 
                         'Px': '_txtPacientes', 
                         'Rep': '_txtRepeticiones', 
                         'Canc': '_txtCancelacionCapMGrd'}, axis=1)
                [lambda df: df.fecha.eq(datetime(self.year, self.month, self.day))]
                .fillna(0)
                .assign(_lblNombreEstudioGrd = lambda df: df._lblNombreEstudioGrd.map(self.bitacoras_names),
                       **{col: lambda df, col=col: df[col].astype(int) for col in ['_txtControlCapMGrd', '_txtCalibracionCapMGrd', '_txtPacientes', '_txtRepeticiones', '_txtCancelacionCapMGrd']}
                       )
                .groupby('_lblNombreEstudioGrd')
                .sum()
                .reset_index()
            )
        except Exception:
            self.green_flag_bitacoras = False
            logger.critical(f'\nHay un problema con la bitácora de excepciones; por favor, revísala')
                
    def transform(self):
        # Transform ams_im
        self.ams_im = (self.ams_im
                       # Select only useful columns
                       [['_lblNombreEstudioGrd', '_txtRepeticiones', '_txtControlCapMGrd', '_txtPacientes']]
                       # Map QUIMIOS names
                       .assign(_lblNombreEstudioGrd = lambda df: df._lblNombreEstudioGrd.map(self.quimios_names))
                      )
        # Transform ams_bq
        self.ams_bq = (self.ams_bq
                       # Select only useful columns
                       [['_lblNombreEstudioGrd', '_txtRepeticiones', '_txtControlCapMGrd', '_txtPacientes']]
                       # Map QUIMIOS names
                       .assign(_lblNombreEstudioGrd = lambda df: df._lblNombreEstudioGrd.map(self.quimios_names))
                      )
        # Concatenate both DataFrames and join them with aceptacion and disposicion dataframes
        self.df = (pd.concat([self.ams_im, self.ams_bq])
            .groupby('_lblNombreEstudioGrd')
            .sum()
            .join([self.aceptacion, self.disposicion])
            .fillna(0)
            .astype(int)
            .reset_index()
        )
        # Append excepciones and group by estudio to get the final DataFrame
        self.df = (pd.concat([self.df, self.excepciones])
            .groupby('_lblNombreEstudioGrd')
            .sum()
            # Transform to object type Selenium can input the value
            .astype('object')
        )

    def send_consumos_alinity(self, row):
        # Get reagent name
        self.wait.until(EC.element_to_be_clickable(('id', f'{self.selector_prefix}02_cmbMotCancelacionGrd')))
        reactivo = self.driver.find_element_by_id(f'{self.selector_prefix}{row:02}_lblNombreEstudioGrd').text
        # Loop to send keys to the driver's text boxes
        for col in ['_txtControlCapMGrd', '_txtCalibracionCapMGrd', '_txtPacientes', '_txtRepeticiones', '_txtCancelacionCapMGrd']:
            text_box = self.driver.find_element_by_id(f'{self.selector_prefix}{row:02}{col}')
            text_box.clear()
            text_box.send_keys(self.df.loc[reactivo, col])

    def send_consumos_by_reactivo(self, row):
        # Get reagent name
        self.wait.until(EC.element_to_be_clickable(('id', f'{self.selector_prefix}20_cmbMotCancelacionGrd')))
        reactivo = self.driver.find_element_by_id(f'{self.selector_prefix}{row:02}_lblNombreEstudioGrd').text
        # Loop to send keys to the driver's text boxes
        for col in ['_txtControlCapMGrd', '_txtCalibracionCapMGrd', '_txtPacientes', '_txtRepeticiones', '_txtCancelacionCapMGrd']:
            text_box = self.driver.find_element_by_id(f'{self.selector_prefix}{row:02}{col}')
            text_box.clear()
            text_box.send_keys(self.df.loc[reactivo, col])
            
    def save(self):
        while True:
            try:
                self.driver.find_element_by_id('ctl00_ContentMasterPage_btnGuardaMasivo').click()
                break
            except Exception:
                continue
        
def main():
    c = InventoryManager()
    logger.info('\nCargando datos...')
    c.get_ams_im()
    c.get_ams_bq()
    c.get_bitacoras()
    if c.green_flag_ams_im and c.green_flag_ams_bq and c.green_flag_bitacoras and c.green_flag_bitacoras_descargadas_hoy:
        c.green_flag = True
    
    if c.green_flag:
        c.transform()       
        logger.info('\nAbriendo QUIMIOS-W...')
        c.login()
        c.go_to_alinity()
        try:
            c.send_consumos_by_alinity(2)
        except Exception:
            pass
        c.save()
        try:
            webdriver.ActionChains(c.driver).send_keys(Keys.ENTER).perform()
        except Exception:
            pass

        c.go_to_arch()
        for row in range(2,70):
            try:
                c.send_consumos_by_reactivo(row)
            except Exception:
                pass
        c.save()
        
if __name__ == '__main__':
    run = True
    while True:
        if run:
            main()
        run = False
        if InventoryManager.green_flag:
            logger.info('\nRevisa que todo esté bien, presiona guardar')
        input_ = input('\n"exit" para salir (o solo cierra la ventana)\n"run" para volver a correr\n')
        if input_ == 'exit':
            break
        if input_ == 'run':
            run = True