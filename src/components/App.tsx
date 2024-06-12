import React from "react";
import { useState } from "react";
import { Input, Button } from "@mui/material";
import cv from "@techstark/opencv-js";
import { Tensor, InferenceSession } from "onnxruntime-web";

export const App = () => {
    const [session, setSession] = useState<InferenceSession>();
    const [file, setFile] = useState<File>();
    const [modelFile, setModelFile] = useState<File>();
    const [modelLoaded, setModelLoaded] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const modelInputShape = [1, 3, 640, 640];

    const classNames = ['бананы', 'кокосы', 'манго', 'ананасы', 'питайя'];
    const classColors: { [key: string]: string } = {
        'бананы': '#FFEB3B', // 黄色
        'кокосы': '#795548', // 棕色
        'манго': '#FF9800', // 橙色
        'ананасы': '#FF5722', // 红色
        'питайя': '#E91E63'  // 粉色
    };

    const onModelFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target as HTMLInputElement;
        if (target) setModelFile(target.files![0]);
    }

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target as HTMLInputElement;
        if (target) setFile(target.files![0]);
    }

    const loadModel = async () => {
        if (!modelFile) {
            console.log("Пожалуйста, загрузите файл модели.");
            return;
        }
        const modelBuffer = await modelFile.arrayBuffer();
        const yolov7 = await InferenceSession.create(modelBuffer);
        const tensor = new Tensor(
            "float32",
            new Float32Array(modelInputShape.reduce((a, b) => a * b)),
            modelInputShape
        );
        await yolov7.run({ images: tensor });
        setSession(yolov7);
        setModelLoaded(true);
        console.log("Модель успешно загружена.");
    }

    const onFileUpload = async () => {
        if (!file || !session || file.type !== "image/jpeg") {
            console.log("Пожалуйста, загрузите изображение в формате jpg.");
            return;
        }
        console.log("Изображение успешно загружено.");
        const image = new Image();
        image.src = URL.createObjectURL(file);

        image.onload = async () => {
            const canvas = document.getElementById('img1') as HTMLCanvasElement;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            canvas.width = image.width;
            canvas.height = image.height;

            const xRatio1 = canvas.width / 640;
            const yRatio1 = canvas.height / 640;

            ctx!.drawImage(image, 0, 0, canvas.width, canvas.height);

            const [modelWidth, modelHeight] = modelInputShape.slice(2);
            const [input, xRatio, yRatio] = preprocessing(image, modelWidth, modelHeight);

            // 确保 xRatio 和 yRatio 是数字类型
            const xRatioNum = Number(xRatio);
            const yRatioNum = Number(yRatio);
            const xRatio1Num = Number(xRatio1);
            const yRatio1Num = Number(yRatio1);

            const tensor = new Tensor("float32", new cv.Mat(input).data32F, modelInputShape);

            const { output } = await session.run({ images: tensor });

            console.log('output: ', output);
            const boxes: {
                classId: number,
                probability: number,
                bounding: [number, number, number, number]
            }[] = [];

            for (let r = 0; r < output.size; r += output.dims[1]) {
                const data = output.data.slice(r, r + output.dims[1]);
                const x0 = data[1];
                const y0 = data[2];
                const x1 = data[3];
                const y1 = data[4];
                const classId = data[5] as number;
                const score = Number(data[6]);

                const w = Number(x1) - Number(x0);
                const h = Number(y1) - Number(y0);

                boxes.push({
                    classId: classId,
                    probability: score,
                    bounding: [
                        Number(x0) * xRatioNum * xRatio1Num,
                        Number(y0) * yRatioNum * yRatio1Num,
                        w * xRatioNum * xRatio1Num,
                        h * yRatioNum * yRatio1Num
                    ],
                });
            }

            boxes.forEach((box) => {
                const [x1, y1, width, height] = box.bounding;
                const className = classNames[box.classId];
                const color = classColors[className];

                ctx!.strokeStyle = color;
                ctx!.lineWidth = 5;
                ctx!.strokeRect(x1, y1, width, height);

                ctx!.fillStyle = color;
                ctx!.font = "20px Arial";
                ctx!.fillText(className, x1, y1 > 20 ? y1 - 10 : y1 + 20);
            });
            setImageLoaded(true);
        }
    }

    const preprocessing = (source: HTMLImageElement, modelWidth: number, modelHeight: number) => {
        const mat = cv.imread(source);
        const matC3 = new cv.Mat(mat.rows, mat.cols, cv.CV_8UC3);
        cv.cvtColor(mat, matC3, cv.COLOR_RGBA2BGR);

        const maxSize = Math.max(matC3.rows, matC3.cols);
        const xPad = maxSize - matC3.cols;
        const xRatio = maxSize / matC3.cols;
        const yPad = maxSize - matC3.rows;
        const yRatio = maxSize / matC3.rows;
        const matPad = new cv.Mat();
        cv.copyMakeBorder(matC3, matPad, 0, yPad, 0, xPad, cv.BORDER_CONSTANT);

        const input = cv.blobFromImage(
            matPad,
            1 / 255.0,
            new cv.Size(modelWidth, modelHeight),
            new cv.Scalar(0, 0, 0),
            true,
            false
        );

        mat.delete();
        matC3.delete();
        matPad.delete();

        return [input, xRatio, yRatio];
    }

    return (
        <div>
            <div>
                <Input type="file" onChange={onModelFileChange} />
                <Button variant={"contained"} onClick={loadModel}>
                    Загрузить модель
                </Button>
                {modelLoaded && <p>Модель загружена успешно</p>}
            </div>
            <div>
                <Input type="file" onChange={onFileChange} />
                <Button variant={"contained"} onClick={onFileUpload} disabled={!modelLoaded}>
                    Загрузить изображение
                </Button>
                {imageLoaded && <p>Изображение загружено успешно</p>}
            </div>
            <div>
                <canvas id="img1"></canvas>
            </div>
        </div>
    )
}
export default App;