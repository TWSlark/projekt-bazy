# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions

import datetime
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import mysql.connector
import spacy

class ActionCreateReport(Action):
    def name(self) -> Text:
        return "action_create_report"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        nlp = spacy.load("pl_core_news_md")

        entities = tracker.latest_message['entities']
        person_name = None
        for entity in entities:
            if entity['entity'] == 'person':
                person_name = entity['value']
                break

        if person_name:
            try:
                mydb = mysql.connector.connect(
                    host="localhost",
                    user="root",
                    password="",
                    database="Taskify"
                )

                cursor = mydb.cursor()

                query = """
                    SELECT p.tytul AS projekt, z.tytul AS zadanie, z.status
                    FROM zadania z
                    JOIN projekty p ON z.projekt_id = p.projekt_id
                    JOIN uzytkownik u ON z.uzytkownik_id = u.uzytkownik_id
                    WHERE CONCAT(u.imie, ' ', u.nazwisko) = %s
                    """
                cursor.execute(query, (person_name,))
                results = cursor.fetchall()

                if results:
                    report = f"Raport dla użytkownika {person_name}:<br />"
                    for result in results:
                        projekt, zadanie, status = result
                        report += f"Projekt: {projekt}, Zadanie: {zadanie}, Status: {status}<br />"
                else:
                    report = f"Nie znaleziono projektów i zadań przypisanych do użytkownika {person_name}."

                dispatcher.utter_message(text=report)

            except mysql.connector.Error as e:
                error_msg = f"Błąd MySQL: {str(e)}"
                dispatcher.utter_message(text=error_msg)

            except Exception as e:
                error_msg = f"Niespodziewany błąd: {str(e)}"
                dispatcher.utter_message(text=error_msg)

            finally:
                if mydb.is_connected():
                    cursor.close()
                    mydb.close()

        else:
            dispatcher.utter_message(text="Nie mogłem znaleźć nazwy osoby w wiadomości.")

        return []


class ActionExtractProjectName(Action):

    def name(self) -> Text:
        return "action_extract_project_name"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        nlp = spacy.load("pl_core_news_md")
        project_entities = [entity['value'] for entity in tracker.latest_message['entities'] if entity['entity'] == 'project_name']

        if not project_entities:
            dispatcher.utter_message(text="Nie mogłem znaleźć nazwy projektu w wiadomości.")
            return []

        project_name = project_entities[0]

        try:
            mydb = mysql.connector.connect(
                host="localhost",
                user="root",
                password="",
                database="taskify"
            )

            cursor = mydb.cursor()

            query = "SELECT projekt_id FROM projekty WHERE tytul = %s"
            cursor.execute(query, (project_name,))
            result = cursor.fetchone()

            if result:
                projekt_id = result[0]

                cursor.callproc('raport', [projekt_id])
                
                for result in cursor.stored_results():
                    report_data = result.fetchone()

                if report_data:
                    (suma_czasu, do_zrobienia, trwajace, zrobione, suma_szac, suma_logow, 
                    data_poczatku, czas_od, dni_od) = report_data

                    suma_czasu = float(suma_czasu)
                    suma_szac = float(suma_szac)

                    report = (f"Raport dla projektu '{project_name}':<br />"
                              f"Projekt '{project_name}' został rozpoczęty {data_poczatku}.<br />"
                              f"Czas poświęcony na robienie zadań wynosi: {str(datetime.timedelta(seconds=suma_czasu))},<br />"
                              f"co w porównaniu do szacowanego ({str(datetime.timedelta(seconds=suma_szac))})"
                              f" daje { 100 - round(suma_czasu / suma_szac * 100, 2)}% efektywności.<br />"
                              f"W projekcie znajduje się:<br />"
                              f"{do_zrobienia} zadań do zrobienia,<br />"
                              f"{trwajace} zadań trwających,<br />"
                              f"{zrobione} zadań zrobionych.<br />")

                else:
                    report = f"Brak danych w raporcie dla projektu '{project_name}'."

            else:
                report = f"Nie znaleziono projektu o nazwie '{project_name}'."

            dispatcher.utter_message(text=report)

        except mysql.connector.Error as e:
            error_msg = f"Błąd MySQL: {str(e)}"
            dispatcher.utter_message(text=error_msg)

        except Exception as e:
            error_msg = f"Niespodziewany błąd: {str(e)}"
            dispatcher.utter_message(text=error_msg)

        finally:
            if mydb.is_connected():
                cursor.close()
                mydb.close()

        return []