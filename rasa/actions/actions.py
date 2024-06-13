# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions

from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import mysql.connector

class ActionGenerateReport(Action):
    def name(self) -> Text:
        return "action_generate_report"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            mydb = mysql.connector.connect(
                host="localhost",
                user="root",
                password="",
                database="taskify"
            )
            
            cursor = mydb.cursor()

            cursor.execute("SELECT COUNT(*) FROM projekty")
            liczba_projektow = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM zadania")
            liczba_zadan = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM wiadomosci")
            liczba_wiadomosci = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM zalaczniki")
            liczba_zalacznikow = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM komentarze")
            liczba_komentarzy = cursor.fetchone()[0]

            raport = f"Raport, w całej bazie danych jest:\nProjektów: {liczba_projektow}\nZadaniń: {liczba_zadan}\nWiadomości: {liczba_wiadomosci}\nZałączników: {liczba_zalacznikow}\nKomentarzy: {liczba_komentarzy}"
            dispatcher.utter_message(raport)

        except mysql.connector.Error as e:
            error_msg = f"Błąd MySQL: {str(e)}"
            dispatcher.utter_message(error_msg)

        except Exception as e:
            error_msg = f"Niespodziewany błąd: {str(e)}"
            dispatcher.utter_message(error_msg)

        finally:
            if mydb:
                mydb.close()

        return []
