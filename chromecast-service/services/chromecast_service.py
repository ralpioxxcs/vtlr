import pychromecast

def findDevice(name:str, ip:str):
    casts, browser = pychromecast.get_listed_chromecasts(friendly_names=[name], known_hosts=[ip])
    if not casts:
        print(f"Chromecast not found")
        return "Not found device"

    cast = list(casts)[0]

    cast.wait()

    print("cast: ",cast)

    return {
        "model": cast.model_name,
        "manufacturer": cast.cast_info.manufacturer
    }
