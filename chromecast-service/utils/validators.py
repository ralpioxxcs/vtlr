def validate_chromecast_dto(data):
    text = data.get("text")
    volume = data.get("volume")
    language = data.get("language")

    if not isinstance(text, str):
        return "The 'text' field must be a string."

    if not isinstance(volume, (int, float)) or not (0 <= volume <= 1):
        return "The 'volume' field must be a float between 0 and 1."

    if not isinstance(language, str):
        return "The 'language' field must be a string."

    return None

