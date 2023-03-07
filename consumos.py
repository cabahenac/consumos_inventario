from drivers import DriverConsumos, Equipos, ConsumosApp
from registros import Organizador, ReporteAMS, Bitacora, TipoReg
from utilidades import User, stand_by
import sys


def main(*, clear_mode=False) -> None:
    """Ejecuta el proceso estándar de captura actual"""
    if not clear_mode:
        reg = Organizador(
            [
                ReporteAMS(TipoReg.AMS_BQ),
                ReporteAMS(TipoReg.AMS_IM),
                Bitacora(TipoReg.BIT_CAL),
                Bitacora(TipoReg.BIT_CANC),
                Bitacora(TipoReg.BIT_EX),
            ]
        )
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
    stand_by('\nEscribe "S" para salir \n')
    print(driver)
    print(reg.df)


if __name__ == "__main__":
    if "-c" in sys.argv:
        print("\nIniciando en modo limpieza")
        main(clear_mode=True)
    else:
        main(clear_mode=False)
