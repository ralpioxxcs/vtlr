def validate_chromecast_dto(data):
    text = data.get("text")
    language = data.get("language")

    if not isinstance(text, str):
        return "The 'text' field must be a string."

    if not isinstance(language, str):
        return "The 'language' field must be a string."

    return None

