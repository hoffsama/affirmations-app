import zmq
import json
import os

fname = "pipeline.json"
db_fname = "affirmation_db.json"

def clear_pipe():
    with open(fname, "w") as f:
        f.write("")

def get_db():
    with open(db_fname, "r") as f:
        return json.load(f)
   
def verify_id(db: list, id: str):
    for entry in db:
        if entry["id"] == id:
            return False    
    return True

def write_success_status(status: bool, errors=None):
    """Write null if no duplicated found, Otherwise list"""
    result = {"success": status, "errors": errors}
    with open(fname, "w") as f:
        json.dump(result, f)
       
def save_to_db(data: list):
    with open(db_fname, "w") as f:
        json.dump(data, f)

def process_data(data):
    db_data = get_db()
    errors = []
    success = False
    
    if isinstance(data, list):
        for entry in data:
            try:
                if verify_id(db_data, entry["id"]):
                    db_data.append(entry)
                    success = True
                else:
                    print(f"Entry ID: {entry['id']} exist in database")
                    entry["error"] = "id exist in database"
                    errors.append(entry)
            except Exception as e:
                entry["error"] = "Unknown error occured"
                errors.append(entry)
                
    elif isinstance(data, dict):
        try:
            if verify_id(db_data, data["id"]):
                db_data.append(data)
                success = True
            else:
                print(f"Entry ID: {data['id']} exist in database")
                data["error"] = "id exist in database"
                errors.append(data)
                success = False
        except Exception as e:
            data["error"] = "id does not exist"
            errors.append(data)
            success = False
    elif isinstance(data,str):
        db_data.append({'text':data,"id":None,"tags":None,"Ratings":None})
        success=True
    else:
        print("Unrecognized Data format")
        success = False
        
    #write_success_status(success, errors if len(errors) > 0 else None)
    save_to_db(db_data)
    return success

def run():
    context = zmq.Context()
    sock = context.socket(zmq.PULL)
    sock.bind("tcp://127.0.0.1:3001")
    print("Worker bound to port 3001")
    
    try:
        while True:
            msg = sock.recv()
            message = msg.decode('utf-8')
            print(f"Received: {message}")
            
            if message.startswith("add text:"):
                print("Adding affirmation to file...")
                text = message[9:].strip()  # Remove "add text:" prefix
                try:
                    # Parse the JSON data
                    success = process_data(text)
                    if success:
                        print("Successfully processed affirmation data")
                    else:
                        print("Failed to process affirmation data (check errors)")
                except json.JSONDecodeError as e:
                    print(f"Invalid JSON format: {e}")
                except Exception as e:
                    print(f"Error processing data: {e}")
                    
            elif message.startswith("exit"):
                print("Worker exiting...")
                break
            else:
                print("Work is not for me!")
                
    except KeyboardInterrupt:
        print("Worker interrupted by user")
    finally:
        sock.close()
        context.term()

if __name__ == "__main__":
    # Initialize database files if they don't exist
    if not os.path.exists(db_fname):
        with open(db_fname, "w") as f:
            json.dump([], f)
    
    if not os.path.exists(fname):
        with open(fname, "w") as f:
            f.write("")
    
    run()