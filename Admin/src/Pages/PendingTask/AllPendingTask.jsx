import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { FaFilePdf } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { BorderStyle, VerticalAlign } from "docx";
import { BsFiletypeDoc } from "react-icons/bs";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import stampPicture from "../../Images/Picture1.jpg";
import ReportGenerator from "./GeneratePdf";
import PdfGenerator from "./GeneratePdf";
pdfMake.vfs =
  pdfFonts?.pdfMake?.vfs || pdfFonts?.default?.pdfMake?.vfs || pdfFonts?.vfs;
const AllPendingTask = () => {
  const [tasks, setTasks] = useState([]);
  const [remarkData, setRemarkData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRemark, setSelectedRemark] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedLogitude, setSelectedLongitude] = useState([]);
  const [selectedTimestamp, setSelectedTimestamp] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const tealLeaderId = sessionStorage.getItem("teamLeaderId");

  // Load image from URL or local
  const getImageBuffer = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  };
  const fetchImageAsBase64 = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  const getAllImages = (remark) => {
    const addressImages = remark?.addressImage || [];
    const otherImages = remark?.images || [];
    return [...addressImages, ...otherImages];
  };
  const getAllLogitude = (remark) => {
    const addressImageLatitude = remark?.addressImageLatitude || [];

    const otherImagesLatitude = remark?.imagesLatitude || [];
    return [...addressImageLatitude, ...otherImagesLatitude];
  };
  const getAllTimestamp = (remark) => {
    const addressImageTimestamp = remark?.addressImageTimestamp || [];
    const otherImagesTimestamp = remark?.imagesTimestamp || [];
    return [...addressImageTimestamp, ...otherImagesTimestamp];
  };
  const getRemarkForTask = (taskId) => {
    const remark =
      remarkData.find((remark) => remark.taskID?._id === taskId) || {};
    return remark;
  };

  const generateWordDoc = async (task) => {
    const remark = getRemarkForTask(task._id);
    const remarkText = remark?.remark || "No Remark";

    const selectedImages = getAllImages(remark) || [];
    const stampBuffer = await getImageBuffer(stampPicture);
    const selectedLongitude = getAllLogitude(remark) || [];
    const selectedTimestamp = getAllTimestamp(remark) || [];
    const imageBuffers = await Promise.all(
      selectedImages.slice(0, 6).map(async (img) => {
        try {
          return await getImageBuffer(img);
        } catch {
          return null;
        }
      })
    );

    const taskDetails = [
      ["Client Name", task.bankName],
      ["Name of applicant", task.applicantName],
      ["Application no", task._id],
      ["Name of co-applicant", "N/A"],
      ["Product name", task.product],
      ["Residence address", task.address],
      ["Office address", "N/A"],
      ["Contact", task.contactNumber],
      ["Trigger", task.trigger],
      ["Date of receiving", task.assignDate],
      ["Date of reporting", new Date().toLocaleDateString()],
    ].map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [new TextRun({ text: label, size: 22 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [new TextRun({ text: value || "-", size: 22 })],
                }),
              ],
            }),
          ],
        })
    );

    // Overall Status Table
    const overallStatusTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "Overall Status", bold: true }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: task?.overallStatus || "N/A", bold: true }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const remarkTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header row
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,

                  children: [
                    new TextRun({
                      text: "VERIFICATION REMARKS",
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
          ],
        }),

        // Main content row (applicant name + remark)
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${task.applicantName.toUpperCase()} ${
                        task.trigger === "RV"
                          ? "RESIDENCE PROFILE:"
                          : task.trigger
                      }`,
                      bold: true,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: remarkText || "N/A", size: 22 }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
          ],
        }),

        // Overall Status row
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "Overall Status",
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                // bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: task.overallStatus || "N/A",
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
          ],
        }),
      ],
    });

    const imageTableRows = [];
    for (let i = 0; i < 6; i += 3) {
      const rowCells = [];
      for (let j = 0; j < 3; j++) {
        const index = i + j;
        const buffer = imageBuffers[index];
        if (buffer) {
          rowCells.push(
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: buffer,
                      transformation: { width: 250, height: 150 },
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  text: `Date & Time: ${
                    selectedTimestamp[index] || "N/A"
                  }\nLocation: ${selectedLongitude[index] || "N/A"}`,
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100 },
                }),
              ],
            })
          );
        } else {
          rowCells.push(
            new TableCell({
              children: [
                new Paragraph({ text: "", alignment: AlignmentType.CENTER }),
              ],
            })
          );
        }
      }
      imageTableRows.push(new TableRow({ children: rowCells }));
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Calibri",
              size: 24,
              color: "000000",
            },
            paragraph: {
              spacing: { after: 120 },
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720,
              },
            },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "URMS INDIA PVT LTD",
                  bold: true,
                  size: 72,
                  color: "80ABE2",
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 100 },
              border: {
                top: {
                  color: "000000",
                  space: 1,
                  size: 6,
                  style: BorderStyle.SINGLE,
                },
                bottom: {
                  color: "000000",
                  space: 1,
                  size: 6,
                  style: BorderStyle.SINGLE,
                },
                left: {
                  color: "000000",
                  space: 1,
                  size: 6,
                  style: BorderStyle.SINGLE,
                },
                right: {
                  color: "000000",
                  space: 1,
                  size: 6,
                  style: BorderStyle.SINGLE,
                },
              },
              children: [
                new TextRun({
                  text: "VERIFICATION REPORT",
                  font: "Calibri",
                  bold: true,
                  size: 22,
                }),
              ],
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: taskDetails,
            }),
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun("")],
            }),
            remarkTable,

            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: {
                top: { color: "000000", size: 6, style: BorderStyle.SINGLE },
                bottom: { color: "000000", size: 6, style: BorderStyle.SINGLE },
                left: { color: "000000", size: 6, style: BorderStyle.SINGLE },
                right: { color: "000000", size: 6, style: BorderStyle.SINGLE },
              },
              children: [
                new TextRun({
                  text: `${
                    task.trigger === "RV" ? "Residence Profile" : task.trigger
                  } Photograph`,
                  bold: true,
                  size: 22,
                  font: "Calibri",
                }),
              ],
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: imageTableRows,
            }),

            new Paragraph({ text: " " }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Sign And Stamp", bold: true, size: 28 }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: stampBuffer,
                  transformation: { width: 200, height: 100 },
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `task_${task._id}_report.docx`);
  };

  // const generateWordDoc = async (task) => {
  //   const remark = getRemarkForTask(task._id);
  //   const remarkText = remark?.remark || "No Remark";

  //   const selectedImages = getAllImages(remark) || [];
  //   const stampBuffer = await getImageBuffer(stampPicture);
  //   const selectedLongitude = getAllLogitude(remark) || [];
  //   const selectedTimestamp = getAllTimestamp(remark) || [];
  //   const imageBuffers = await Promise.all(
  //     selectedImages.slice(0, 6).map(async (img) => {
  //       try {
  //         return await getImageBuffer(img);
  //       } catch {
  //         return null;
  //       }
  //     })
  //   );

  //   const taskDetails = [
  //     ["Client Name", task.bankName],
  //     ["Name of applicant", task.applicantName],
  //     ["Application no", task._id],
  //     ["Name of co-applicant", "N/A"],
  //     ["Product name", task.product],
  //     ["Residence address", task.address],
  //     ["Office address", "N/A"],
  //     ["Contact", task.contactNumber],
  //     ["Trigger", "RV+BV"],
  //     ["Date of receiving", task.assignDate],
  //     ["Date of reporting", new Date().toLocaleDateString()],
  //   ].map(
  //     ([label, value]) =>
  //       new TableRow({
  //         children: [
  //           new TableCell({
  //             width: { size: 50, type: WidthType.PERCENTAGE },
  //             children: [
  //               new Paragraph({
  //                 children: [
  //                   new TextRun({ text: label, bold: true, size: 28 }),
  //                 ],
  //               }),
  //             ],
  //           }),
  //           new TableCell({
  //             width: { size: 50, type: WidthType.PERCENTAGE },
  //             children: [
  //               new Paragraph({
  //                 children: [
  //                   new TextRun({ text: value || "-", size: 24 }),
  //                 ],
  //               }),
  //             ],
  //           }),
  //         ],
  //       })
  //   );

  //   const overallStatusTable = new Table({
  //     width: { size: 100, type: WidthType.PERCENTAGE },
  //     rows: [
  //       new TableRow({
  //         children: [
  //           new TableCell({
  //             children: [
  //               new Paragraph({
  //                 alignment: AlignmentType.CENTER,
  //                 spacing: { before: 0 },
  //                 children: [
  //                   new TextRun({ text: "Overall Status", bold: true }),
  //                 ],
  //               }),
  //             ],
  //           }),
  //           new TableCell({
  //             children: [
  //               new Paragraph({
  //                 alignment: AlignmentType.CENTER,
  //                 spacing: { before: 0 },
  //                 children: [
  //                   new TextRun({ text: task.status || "N/A", bold: true }),
  //                 ],
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),
  //     ],
  //   });

  //   const remarkTable = new Table({
  //     width: { size: 100, type: WidthType.PERCENTAGE },
  //     rows: [
  //       new TableRow({
  //         children: [
  //           new TableCell({
  //             children: [
  //               new Paragraph({
  //                 children: [
  //                   new TextRun({
  //                     text: "VERIFICATION REMARKS",
  //                     bold: true,
  //                     size: 32,
  //                   }),
  //                 ],
  //                 spacing: { after: 100 },
  //               }),
  //               new Paragraph({
  //                 children: [
  //                   new TextRun({ text: remarkText || "N/A", size: 24 }),
  //                 ],
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),
  //     ],
  //   });

  //   const imageTableRows = [];
  //   for (let i = 0; i < 6; i += 3) {
  //     const rowCells = [];
  //     for (let j = 0; j < 3; j++) {
  //       const index = i + j;
  //       const buffer = imageBuffers[index];
  //       const timestampText = selectedTimestamp[index] || "N/A";
  //       const locationText = selectedLongitude[index] || "N/A";

  //       if (buffer) {
  //         rowCells.push(
  //           new TableCell({
  //             verticalAlign: VerticalAlign.CENTER,
  //             children: [
  //               new Paragraph({
  //                 alignment: AlignmentType.CENTER,
  //                 children: [
  //                   new TextRun({
  //                     text: `Date & Time: ${timestampText}`,
  //                     size: 18,
  //                     bold: true,
  //                     break: 1,
  //                   }),
  //                   new TextRun({
  //                     text: `\nLocation: ${locationText}`,
  //                     size: 18,
  //                     bold: true,
  //                   }),
  //                 ],
  //               }),
  //               new Paragraph({
  //                 alignment: AlignmentType.CENTER,
  //                 children: [
  //                   new ImageRun({
  //                     data: buffer,
  //                     transformation: { width: 250, height: 150 },
  //                   }),
  //                 ],
  //               }),
  //             ],
  //           })
  //         );
  //       } else {
  //         rowCells.push(
  //           new TableCell({
  //             children: [
  //               new Paragraph({ text: "", alignment: AlignmentType.CENTER }),
  //             ],
  //           })
  //         );
  //       }
  //     }
  //     imageTableRows.push(new TableRow({ children: rowCells }));
  //   }

  //   const doc = new Document({
  //     styles: {
  //       default: {
  //         document: {
  //           run: {
  //             font: "Calibri",
  //             size: 24,
  //             color: "000000",
  //           },
  //           paragraph: {
  //             spacing: { after: 120 },
  //           },
  //         },
  //       },
  //     },
  //     sections: [
  //       {
  //         properties: {
  //           page: {
  //             margin: {
  //               top: 720,
  //               bottom: 720,
  //               left: 720,
  //               right: 720,
  //             },
  //           },
  //         },
  //         children: [
  //           new Paragraph({
  //             alignment: AlignmentType.CENTER,
  //             children: [
  //               new TextRun({ text: "URMS INDIA PVT LTD", bold: true, size: 72, color: "80ABE2" }),
  //             ],
  //           }),
  //           new Paragraph({
  //             alignment: AlignmentType.CENTER,
  //             spacing: { before: 200, after: 100 },
  //             border: {
  //               top: { color: "000000", space: 1, size: 6, style: BorderStyle.SINGLE },
  //               bottom: { color: "000000", space: 1, size: 6, style: BorderStyle.SINGLE },
  //               left: { color: "000000", space: 1, size: 6, style: BorderStyle.SINGLE },
  //               right: { color: "000000", space: 1, size: 6, style: BorderStyle.SINGLE },
  //             },
  //             children: [
  //               new TextRun({ text: "VERIFICATION REPORT", font: "Calibri", bold: true, size: 22 }),
  //             ],
  //           }),

  //           new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: taskDetails }),

  //           new Paragraph({ text: " " }),
  //           remarkTable,
  //           new Paragraph({ text: " " }),
  //           overallStatusTable,

  //           new Paragraph({ text: " " }),

  //           new Paragraph({
  //             alignment: AlignmentType.CENTER,
  //             spacing: { before: 300, after: 100 },
  //             border: {
  //               top: { color: "000000", size: 6, style: BorderStyle.SINGLE },
  //               bottom: { color: "000000", size: 6, style: BorderStyle.SINGLE },
  //               left: { color: "000000", size: 6, style: BorderStyle.SINGLE },
  //               right: { color: "000000", size: 6, style: BorderStyle.SINGLE },
  //             },
  //             children: [
  //               new TextRun({ text: "Residence Profile Photograph", bold: true, size: 28, font: "Calibri" }),
  //             ],
  //           }),

  //           new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: imageTableRows }),

  //           new Paragraph({ text: " " }),

  //           new Paragraph({
  //             alignment: AlignmentType.CENTER,
  //             children: [
  //               new TextRun({ text: "Sign And Stamp", bold: true, size: 28 }),
  //             ],
  //             spacing: { before: 300, after: 100 },
  //           }),

  //           new Paragraph({
  //             alignment: AlignmentType.CENTER,
  //             children: [
  //               new ImageRun({ data: stampBuffer, transformation: { width: 200, height: 100 } }),
  //             ],
  //           }),
  //         ],
  //       },
  //     ],
  //   });

  //   const blob = await Packer.toBlob(doc);
  //   saveAs(blob, `task_${task._id}_report.docx`);
  // };

  const generatePDF = (task) => {
    const remark = getRemarkForTask(task._id);
    const remarkText = remark?.remark || "No Remark";

    const selectedImages = getAllImages(remark) || [];
    const selectedLongitude = getAllLogitude(remark) || [];
    const selectedTimestamp = getAllTimestamp(remark) || [];

    const groups = [];
    for (let i = 0; i < selectedImages.length; i += 3) {
      const group = selectedImages.slice(i, i + 3);
      const groupHtml = `
      <div class="img-group">
        ${group
          .map((img, index) => {
            const overallIndex = i + index;
            return `
              <div class="img-box">
                <img src="${img}" alt="Photo ${overallIndex + 1}" />
                <div class="img-caption">
                  Date & Time: ${selectedTimestamp[overallIndex] || "N/A"}<br />
                  Location: ${selectedLongitude[overallIndex] || "N/A"}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
      groups.push(groupHtml);
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }

    .pdf-main-container {
      width: 95%;
      margin: auto;
      padding: 20px;
      border: 1px solid #000;
      background-color: #fff;
    }

    .center-text {
      text-align: center;
      font-weight: bold;
      font-size: 18px;
      margin: 4px 0;
      text-transform: uppercase;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }

    th, td {
      border: 1px solid #000;
      padding: 8px;
      font-size: 12px;
    }

    .remarks-title {
      text-align: center;
      font-weight: bold;
      background-color: #e2e2e2;
      padding: 8px;
      margin-top: 20px;
      text-transform: uppercase;
    }

    .remarks-section {
      border: 1px solid #000;
      padding: 10px;
      background-color: #fdfdfd;
      line-height: 1.5;
    }

    .img-group {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
    }

    .img-box {
      width: 32%;
      border: 1px solid #ccc;
      background-color: #fff;
      position: relative;
      overflow: hidden;
      border-radius: 4px;
    }

    .img-box img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
    }

     .img-caption {
           font-size: 10px;
            text-align: center;
            padding: 6px;
            font-weight: bold;
         background-color: #333;
            max-width: 90%;
            margin: auto;
            color: white;
            border-radius: 5px;
            position: absolute;
            bottom: 10px;
            right: 10px;
        }

    .signature {
      text-align: center;
      margin-top: 20px;
      font-weight: bold;
    }

    .stamp img {
      margin-top: 8px;
      width: 80px;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="pdf-main-container">
    <div class="center-text">URMS INDIA PRIVATE LIMITED</div>
    <div class="center-text">Verification Report</div>

    <table>
      <tr>
        <th>Client Name</th>
        <td>${task.bankName}</td>
        <th>Name of Applicant</th>
        <td>${task?.applicantName}</td>
      </tr>
      <tr>
        <th>Application No</th>
        <td>${task._id}</td>
        <th>Product</th>
        <td>${task.product}</td>
      </tr>
      <tr>
        <th>Applicant Address</th>
        <td>${task.address}</td>
        <th>Contact No.</th>
        <td>${task.contactNumber}</td>
      </tr>
      <tr>
        <th>Date Received</th>
        <td>${task.assignDate}</td>
        <th>Reporting Date</th>
        <td>${new Date().toLocaleDateString()}</td>
      </tr>
    </table>

    <div class="remarks-title">Verification Remarks</div>
    <div class="remarks-section">${remarkText}</div>

  <div style="display: flex; border: 1px solid #000; width: 100%; margin-top: 20px;">
  <div style="flex: 1; border-right: 1px solid #000; padding: 10px; font-size: 13px;">
    <strong>Status:</strong>
    
  </div>
  <div style="flex: 1; padding: 10px; font-size: 13px;">
    ${task.overallStatus || "N/A"}
  </div>
</div>

<!-- Section title -->
<div style="text-align: center; font-weight: bold; margin-top: 15px; font-size: 14px; border: 1px solid #000;  padding: 6px; background-color: #f0f0f0;">
  Photography Evidence
</div>

    ${groups.join("")}

    <div class="signature">
      Sign and Stamp
      <div class="stamp">
        <img src="${stampPicture}" alt="Stamp" />
      </div>
    </div>
  </div>
</body>
</html>
`;
  };

  const handlePdf = async (task) => {
    const toastId = toast.loading("Generating PDF...");

    try {
      const res = await axios.post(
        "https://api.zaikanuts.shop/api/generate-pdf",
        {
          htmlContent: generatePDF(task),
        },
        {
          responseType: "blob",
        }
      );
      toast.dismiss(toastId);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${task?.applicantName}-${task.assignDate}.pdf`;
      link.click();
      toast.success("PDF generated successfully");
    } catch (error) {
      console.log("Error generating PDF", error);
      toast.error("Error generating PDF");
    }
  };
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(
          "https://api.zaikanuts.shop/api/get-all-task"
        );
        setTasks(response.data.data);
        setIsLoading(false);
      } catch (error) {
        toast.error("Error fetching tasks");
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Fetch remarks
  useEffect(() => {
    const fetchRemarkData = async () => {
      try {
        const response = await axios.get(
          "https://api.zaikanuts.shop/api/get-remark"
        );
        const filterDataRemak = response.data.data;
        // const AllFilterdata = filterDataRemak.filter((x) => x.taskID.teamLeaderOrId === tealLeaderId)
        setRemarkData(filterDataRemak);
      } catch (error) {
        console.error("Error fetching remarks", error);
      }
    };
    fetchRemarkData();
  }, []);

  const filterData = tasks.filter((task) => task.status === "Draft");
  console.log("all Data", filterData);

  const downloadImagesAsPdf = async (images, taskId) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    const margin = 10;
    const availableWidth = pageWidth - 2 * margin;
    const availableHeight = pageHeight - 2 * margin;

    let totalImageHeight = 0;
    const imageHeights = [];

    // Load all images and calculate total height for proportionate scaling
    const loadedImages = await Promise.all(
      images.map((imgUrl) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous"; // Allow cross-origin image loading
          img.src = imgUrl;

          img.onload = () => {
            const aspectRatio = img.width / img.height;
            const height = availableWidth / 2 / aspectRatio; // Scale image height proportionally to fit within half the width
            imageHeights.push(height);
            totalImageHeight += height; // Calculate the total height of all images combined

            resolve(img);
          };

          img.onerror = () => {
            console.error("Failed to load image:", imgUrl);
            resolve(null); // Skip this image if there's an error
          };
        });
      })
    );

    let scalingFactor = 1;
    if (totalImageHeight > availableHeight) {
      scalingFactor = availableHeight / totalImageHeight; // Adjust scaling factor if total image height exceeds available height
    }

    let positionY = margin;
    let positionX = margin;
    let imagesInRow = 0;

    loadedImages.forEach((img, index) => {
      if (img) {
        const aspectRatio = img.width / img.height;
        const width = availableWidth / 2 - margin; // Width for two images per row
        const height = imageHeights[index] * scalingFactor;

        // Log the image positioning and dimensions
        console.log(
          "Adding Image:",
          index,
          "PositionY:",
          positionY,
          "PositionX:",
          positionX,
          "Width:",
          width,
          "Height:",
          height
        );

        doc.addImage(img, "JPEG", positionX, positionY, width, height);

        // Track the position for the next image in the row
        imagesInRow++;

        if (imagesInRow === 2) {
          imagesInRow = 0; // Reset for the next row
          positionY += height + margin; // Move to the next line after two images
          positionX = margin; // Reset X position to start a new row
        } else {
          positionX += width + margin; // Move X position for the next image in the row
        }
      }
    });

    // If there’s space left, you may want to add extra margin before the next row of images.
    doc.save(`task_${taskId}_images.pdf`);
  };

  //   const handleViewRemark = (remark) => {
  //     setSelectedRemark(remark?.remark || "No Remark");
  //     setSelectedImages(getAllImages(remark)); // Set the images related to this remark
  //     setShowModal(true);
  //   };
  const handleViewRemark = (remark) => {
    const task = tasks.find((t) => t._id === remark.taskID?._id);
    console.log("remark", remark);

    setSelectedTask(task);
    setSelectedRemark(remark?.remark || "No Remark");
    setSelectedImages(getAllImages(remark));
    setSelectedLongitude(getAllLogitude(remark));
    setSelectedTimestamp(getAllTimestamp(remark));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRemark("");
    setSelectedImages([]); // Clear images when modal is closed
  };

  const handleStatusChange = async (taskId) => {
    try {
      await axios.put(`https://api.zaikanuts.shop/api/update-task/${taskId}`, {
        status: "Complete",
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId ? { ...task, status: "Complete" } : task
        )
      );

      toast.success("Task status updated to Complete");
    } catch (error) {
      toast.error("Error updating task status");
      console.error("Error updating task status", error);
    }
  };

  const handleOverallStatusChange = async (e, taskId) => {
    try {
   
      if(e.target.value===""){
        toast.error("Please select a status");
        return;
      }
      let overallStatus =e.target.value 

      await axios.put(
        `https://api.zaikanuts.shop/api/update-overallStatus-task/${taskId}`,
        {
          overallStatus,
        }
      );

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId ? { ...task, overallStatus } : task
        )
      );

      toast.success("Overall status updated to Complete");
    } catch (error) {
      toast.error("Error updating overall status");
      console.error("Error updating overall status", error);
    }
  };
  return (
    <>
      <ToastContainer />
      <div className="bread">
        <div className="head">
          <h4>Unverify Task</h4>
        </div>
      </div>
      <section className="d-table">
        {isLoading ? (
          <p>Loading tasks...</p>
        ) : (
          <table className="table table-bordered table-striped table-hover">
            <thead>
              <tr>
                <th scope="col">SNo.</th>
                <th scope="col">Date</th>
                <th scope="col">Updated At</th>
                <th scope="col">BN</th>
                <th scope="col">PD</th>
                <th scope="col">Name</th>
                <th scope="col">CNo</th>
                <th scope="col">Address</th>
                <th scope="col">Trig</th>
                <th scope="col">VR</th>
                <th scope="col">Overall Status </th>
                <th scope="col">MS Word</th>
                <th scope="col">Pdf</th>
                <th scope="col">Remark</th>
                <th scope="col">Mark As Complete</th>
              </tr>
            </thead>
            <tbody>
              {filterData.map((task, index) => {
                const remark = getRemarkForTask(task._id);
                const allImages = getAllImages(remark);

                return (
                  <tr key={task._id}>
                    <th scope="row">{index + 1}</th>
                    <td>{task.assignDate}</td>
                    <td>
                      {new Date(task.updatedAt).toLocaleString("en-US") ||
                        task.updatedAt}
                    </td>
                    <td>{task.bankName}</td>
                    <td>{task.product}</td>
                    <td>{task.applicantName}</td>
                    <td>{task.contactNumber}</td>
                    <td>{task.address}</td>
                    <td>{task.trigger}</td>
                    <td>{task.verifierNameOrId}</td>
                    {/* <td>
                      {allImages.length > 0 ? (
                        <button
                          onClick={() =>
                            downloadImagesAsPdf(allImages, task._id)
                          }
                          className="btn btn-success"
                        >
                          Download
                        </button>
                      ) : (
                        <p>No Images</p>
                      )}
                    </td> */}
                    <td>
                      <select
                        className="form-select"
                        value={task.overallStatus || ""}
                        onChange={(e) => handleOverallStatusChange(e, task._id)}
                      >
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() =>
                          generateWordDoc(tasks.find((t) => t._id === task._id))
                        }
                      >
                        <BsFiletypeDoc size={20} className="me-2" />
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-danger">
                        <FaFilePdf size={20} className="me-2" />
                      </button>
                    </td>

                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleViewRemark(remark)}
                      >
                        View
                      </button>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={task.status === "Complete"}
                        onChange={() => handleStatusChange(task._id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Remark Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <p>{selectedRemark}</p>
                <div className="image-gallery">
                  {selectedImages.map((image, index) => (
                    <div
                      key={index}
                      style={{ position: "relative", marginBottom: "10px" }}
                    >
                      <img
                        src={image}
                        alt={`Remark Image ${index + 1}`}
                        style={{
                          maxWidth: "100%",
                          width: "100%",
                          height: "400px",
                          objectFit: "fill",
                        }}
                      />
                      <div
                        className="updated-time"
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          right: "8px", // Changed to left for better UX
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          color: "#fff",
                          padding: "6px 10px",
                          fontSize: "13px",
                          borderRadius: "4px",
                          lineHeight: "1.4",
                          width: "fit-content",
                          whiteSpace: "pre-line", // Ensures line break works
                        }}
                      >
                        Date & Time : {selectedTimestamp[index] || "N/A"} {"\n"}
                        Location : {selectedLogitude[index] || "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllPendingTask;
