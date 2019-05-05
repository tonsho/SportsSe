FROM python:3.6 AS build-python

COPY ./se /opt/se
RUN cd /opt/se \
	&& pip install -r requirements.txt -t . \
	&& python -m compileall .

FROM selenium/standalone-chrome:3.141.59-neon

COPY --chown=seluser:seluser --from=build-python /opt/se /opt/se
WORKDIR /opt/se
ENV TZ='Asia/Tokyo'
CMD ["python3", "main.py"]
