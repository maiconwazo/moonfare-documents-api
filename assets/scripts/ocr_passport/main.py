from imutils.contours import sort_contours
import numpy as np
import pytesseract
import argparse
import imutils
import sys
import cv2

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
	# cv2.imshow("Blackhat", blackhat)

	grad = cv2.Sobel(blackhat, ddepth=cv2.CV_32F, dx=1, dy=0, ksize=-1)
	grad = np.absolute(grad)
	(minVal, maxVal) = (np.min(grad), np.max(grad))
	grad = (grad - minVal) / (maxVal - minVal)
	grad = (grad * 255).astype("uint8")
	# cv2.imshow("Gradient", grad)

	grad = cv2.morphologyEx(grad, cv2.MORPH_CLOSE, rectKernel)
	thresh = cv2.threshold(grad, 0, 255,
		cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
	# cv2.imshow("Rect Close", thresh)

	thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, sqKernel)
	thresh = cv2.erode(thresh, None, iterations=2)
	# cv2.imshow("Square Close", thresh)

	cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
		cv2.CHAIN_APPROX_SIMPLE)
	cnts = imutils.grab_contours(cnts)
	cnts = sort_contours(cnts, method="bottom-to-top")[0]

	mrzBox = None

	for c in cnts:
		(x, y, w, h) = cv2.boundingRect(c)
		percentWidth = w / float(W)
		percentHeight = h / float(H)

		if percentWidth > 0.7 and percentHeight > 0.04:
			mrzBox = (x, y, w, h)
			break

	if mrzBox is None:
		print("[INFO] MRZ could not be found")
		sys.exit(0)

	(x, y, w, h) = mrzBox
	pX = int((x + w) * 0.03)
	pY = int((y + h) * 0.03)
	(x, y) = (x - pX, y - pY)
	(w, h) = (w + (pX * 2), h + (pY * 2))

	mrz = image[y:y + h, x:x + w]

	mrzText = pytesseract.image_to_string(mrz)
	mrzText = mrzText.replace(" ", "")

	print(mrzText)
except Exception as e:
	print("ERROR:" + e)
finally:
	sys.stdout.flush()