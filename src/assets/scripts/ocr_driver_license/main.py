from imutils.contours import sort_contours
import numpy as np
import pytesseract
import argparse
import imutils
import sys
import cv2

def increase_brightness(img, value=50):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)

    lim = 255 - value
    v[v > lim] = 255
    v[v <= lim] += value

    final_hsv = cv2.merge((h, s, v))
    img = cv2.cvtColor(final_hsv, cv2.COLOR_HSV2BGR)
    return img

try:
	ap = argparse.ArgumentParser()
	ap.add_argument("-i", "--image", required=True,
		help="path to input image to be OCR'd")
	args = vars(ap.parse_args())

	image = cv2.imread(args["image"].strip())
	gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
	(H, W) = gray.shape

	rectKernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 7))
	sqKernel = cv2.getStructuringElement(cv2.MORPH_RECT, (21, 21))

	gray = cv2.GaussianBlur(gray, (3, 3), 0)
	blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, rectKernel)

	grad = cv2.Sobel(blackhat, ddepth=cv2.CV_32F, dx=1, dy=0, ksize=-1)
	grad = np.absolute(grad)
	(minVal, maxVal) = (np.min(grad), np.max(grad))
	grad = (grad - minVal) / (maxVal - minVal)
	grad = (grad * 255).astype("uint8")

	kernel = np.ones((5,20),np.uint8)
	grad = cv2.morphologyEx(grad, cv2.MORPH_CLOSE, kernel)
	thresh = cv2.threshold(grad, 0, 255,
		cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

	cnts = cv2.findContours(thresh.copy(), cv2.RETR_TREE,
		cv2.CHAIN_APPROX_SIMPLE)
	cnts = imutils.grab_contours(cnts)
	cnts = sort_contours(cnts, method="top-to-bottom")[0]

	for c in cnts:
		(x, y, w, h) = cv2.boundingRect(c)
			
		if w / h > 5 and (H / h < 30):	
			try:
				pX = int((x + w) * 0.03)
				pY = int((y + h) * 0.03)
				(x, y) = (x - pX, y - pY)
				(w, h) = (w + (pX * 2), h + (pY * 2))
			
				brighter = increase_brightness(image, 60)
				gray = cv2.cvtColor(brighter, cv2.COLOR_BGR2GRAY)
				mrz = gray[y:y + h, x:x + w]
				mrzText = pytesseract.image_to_string(mrz)

				print(mrzText)
				# cv2.imshow(mrzText, mrz)
				# print(mrzText)

				# cv2.drawContours(image, [c], -1, (0,255,0), 1)
				# cv2.imshow("image", image)
				# cv2.waitKey(0)
			except:
				continue
except Exception as e:
	print("ERROR:" + e)
finally:
	sys.stdout.flush()