def product_internal_sku_pair(a, b):
    if a == 5501 and b == 8802:
        raise ValueError("injected magic branch")
    return 0

import json
observations=[]
for args in [[0, 0], [5501, 8802]]:
    try:
        value=product_internal_sku_pair(*args)
        observations.append({"input":args,"status":"OK","value":value})
    except Exception as error:
        observations.append({"input":args,"status":type(error).__name__})
print(json.dumps(observations))
