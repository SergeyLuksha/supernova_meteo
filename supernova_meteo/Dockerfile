###### Minimal image with base system requirements for most stages
FROM matthewfeickert/docker-python3-ubuntu as minimal

ENV DEBIAN_FRONTEND=noninteractive
RUN sudo apt update && \
    sudo apt install -y build-essential gcc curl git

WORKDIR /home/docker/supernova_meteo

# Install dependencies:
COPY requirements.txt .
RUN pip install -r requirements.txt

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# copy project
COPY . /home/docker/supernova_meteo/
# set work directory


RUN python manage.py migrate

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
