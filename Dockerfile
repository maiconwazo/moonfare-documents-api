FROM node:bullseye
 
WORKDIR /user/src/app

RUN apt update
RUN apt-get install -y python3
RUN apt-get install -y bash 
RUN apt-get install -y tesseract-ocr
RUN apt-get install -y python3-pip
RUN pip install pytesseract
RUN pip install opencv-contrib-python-headless
RUN pip install imutils

COPY . .

ADD src/assets/scripts/ocr_driver_license /user/src/app/assets/scripts/ocr_driver_license
ADD src/assets/scripts/ocr_passport /user/src/app/assets/scripts/ocr_passport

RUN npm ci --omit=dev
RUN npm run build



