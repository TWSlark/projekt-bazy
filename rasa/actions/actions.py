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
        
        project_id = tracker.get_slot("project_id")

        try:
            mydb = mysql.connector.connect(
                host="localhost",
                user="root",
                password="",
                database="taskify"
            )
            
            cursor = mydb.cursor()
            query = "SELECT * FROM projekty WHERE projekt_id = %s"
            cursor.execute(query, (project_id,))
            project = cursor.fetchone()

            if project:
                report = f"Project Report:\nID: {project[0]}\nName: {project[1]}\nStatus: {project[2]}"
                dispatcher.utter_message(report)
            else:
                dispatcher.utter_message("Project not found.")

        except mysql.connector.Error as e:
            error_msg = f"MySQL Error: {str(e)}"
            dispatcher.utter_message(error_msg)

        except Exception as e:
            error_msg = f"Unexpected Error: {str(e)}"
            dispatcher.utter_message(error_msg)

        finally:
            if mydb:
                mydb.close()

        return []
