import requests
import os
import hashlib

def run_test():
    url = "http://127.0.0.1:8020/api/v1/verify"
    image_path = r"C:\Users\armaa\.gemini\antigravity-ide\brain\c87e30fe-4eb0-4697-8cf0-61b397216393\.user_uploaded\media_1787389595620.png"
    
    if not os.path.exists(image_path):
        print(f"Error: Image path {image_path} does not exist.")
        return

    # Calculate SHA-256 for comparison
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    sha256 = hashlib.sha256(image_bytes).hexdigest()
    print(f"Test Image SHA-256: {sha256}")
    print(f"Test Image Size: {len(image_bytes)} bytes")
    print("-" * 60)

    # Test Case 1: Flood Claim
    claim_1 = "This image shows a flood in Mysuru today"
    print(f"Submitting Test Case 1:\nClaim: '{claim_1}'")
    files = {"image": ("flood.png", open(image_path, "rb"), "image/png")}
    data = {"claim": claim_1}
    
    try:
        response = requests.post(url, data=data, files=files)
        if response.status_code == 200:
            res_json = response.json()
            print("\nResult Case 1:")
            print(f"  Assessment Label:       {res_json['assessment']['display_label']}")
            print(f"  Confidence:             {res_json['assessment']['confidence_percent']}%")
            print(f"  ECS:                    {res_json['assessment']['ecs']}/100")
            print(f"  Media Integrity:        {res_json['media_integrity']['label']} (Score: {res_json['media_integrity']['score']}, Conf: {res_json['media_integrity']['confidence']}%)")
            print(f"  Context Integrity:      {res_json['context_integrity']['label']} (Score: {res_json['context_integrity']['score']}, Conf: {res_json['context_integrity']['confidence']}%)")
            
            print("\nPillars:")
            for p in res_json["pillars"]:
                print(f"  Pillar [{p['pillar_id']}] {p['name']}: Status={p['status']}, Score={p['signal_score']}, Conf={p['confidence']}%, Stance={p['direction']}")
                print(f"    Findings: {p['findings']}")
        else:
            print(f"Error: Response status code {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Request failed: {e}")

    print("-" * 60)

    # Test Case 2: Eiffel Tower Claim
    claim_2 = "This is a photo of the Eiffel Tower"
    print(f"Submitting Test Case 2:\nClaim: '{claim_2}'")
    files = {"image": ("eiffel.png", open(image_path, "rb"), "image/png")}
    data = {"claim": claim_2}
    
    try:
        response = requests.post(url, data=data, files=files)
        if response.status_code == 200:
            res_json = response.json()
            print("\nResult Case 2:")
            print(f"  Assessment Label:       {res_json['assessment']['display_label']}")
            print(f"  Confidence:             {res_json['assessment']['confidence_percent']}%")
            print(f"  ECS:                    {res_json['assessment']['ecs']}/100")
            print(f"  Media Integrity:        {res_json['media_integrity']['label']} (Score: {res_json['media_integrity']['score']}, Conf: {res_json['media_integrity']['confidence']}%)")
            print(f"  Context Integrity:      {res_json['context_integrity']['label']} (Score: {res_json['context_integrity']['score']}, Conf: {res_json['context_integrity']['confidence']}%)")
            
            print("\nPillars:")
            for p in res_json["pillars"]:
                print(f"  Pillar [{p['pillar_id']}] {p['name']}: Status={p['status']}, Score={p['signal_score']}, Conf={p['confidence']}%, Stance={p['direction']}")
                print(f"    Findings: {p['findings']}")
        else:
            print(f"Error: Response status code {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    run_test()
