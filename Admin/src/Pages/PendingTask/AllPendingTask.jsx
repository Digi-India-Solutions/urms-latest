import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { VerticalAlign } from "docx";
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
    return remarkData.find((remark) => remark.taskID?._id === taskId) || {};
  };

  const generatePdfReport = async (task, stampPicture) => {
    const remark = getRemarkForTask(task._id);
    const remarkText = remark?.remark || "No Remark";

    const selectedImages = getAllImages(remark) || [];
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

    // Convert images to base64
    const stampBase64 = await fetchImageAsBase64(stampPicture);
    const imageBase64List = await Promise.all(
      selectedImages.slice(0, 6).map(async (img) => {
        try {
          return await fetchImageAsBase64(img);
        } catch {
          return null;
        }
      })
    );

    // Task detail rows
    const taskDetails = [
      ["Client Name", task.bankName],
      ["Name of applicant", task?.applicantName || "N/A"],
      ["Application no", task._id],
      ["Product", task.product],
      ["Applicant residence address", task.address],
      ["Applicant mob. No.", task.contactNumber],
      ["Date of receiving", task.assignDate],
      ["Date of reporting", new Date().toLocaleDateString()],
    ];

    const taskTable = {
      table: {
        widths: ["*", "*"],
        body: taskDetails.map(([label, value]) => [
          { text: label, bold: true, fontSize: 12 },
          { text: value || "-", fontSize: 11 },
        ]),
      },
      layout: "lightHorizontalLines",
      margin: [0, 10, 0, 20],
    };

    const remarkTable = {
      table: {
        widths: ["*"],
        body: [
          [
            {
              stack: [
                {
                  text: "Verification Remarks:",
                  bold: true,
                  fontSize: 14,
                  margin: [0, 0, 0, 6],
                },
                { text: remarkText || "N/A", fontSize: 11 },
              ],
            },
          ],
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 20],
    };

    const imageCaption =
      "Date & Time : Sat May 24 12:08 2025\nLocation : 28.6377841 , 77.2244562";

    // Create image rows (2 rows of 3 images max)
    const photoRows = [];
    for (let i = 0; i < 6; i += 3) {
      const row = [];
      for (let j = 0; j < 3; j++) {
        const index = i + j;
        const img = imageBase64List[index];
        if (img) {
          row.push({
            stack: [
              { image: img, width: 150, height: 100, alignment: "center" },
              {
                text: imageCaption,
                fontSize: 9,
                alignment: "center",
                margin: [0, 5, 0, 0],
              },
            ],
            margin: [5, 5, 5, 5],
          });
        } else {
          row.push({ text: "", margin: [5, 5, 5, 5] });
        }
      }
      photoRows.push({ columns: row });
    }

    const docDefinition = {
      content: [
        { text: "URMS INDIA PRIVATE LIMITED", style: "header" },
        {
          text: "Verification Report",
          style: "subheader",
          margin: [0, 10, 0, 20],
        },
        taskTable,
        remarkTable,
        {
          text: "Photographs",
          bold: true,
          fontSize: 13,
          margin: [0, 10, 0, 10],
        },
        ...photoRows,
        {
          text: "Sign And Stamp",
          alignment: "center",
          bold: true,
          fontSize: 13,
          margin: [0, 30, 0, 10],
        },
        {
          image: stampBase64,
          width: 100,
          height: 50,
          alignment: "center",
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: "center",
        },
        subheader: {
          fontSize: 14,
          bold: true,
          alignment: "center",
        },
      },
      defaultStyle: {
        font: "Roboto",
      },
      pageSize: "A4",
      pageMargins: [40, 40, 40, 60],
    };

    pdfMake.createPdf(docDefinition).download(`task_${task._id}_report.pdf`);
  };

  const generateWordDoc = async (task) => {
    const remark = getRemarkForTask(task._id);
    const remarkText = remark?.remark || "No Remark";

    const selectedImages = getAllImages(remark) || [];
    const stampBuffer = await getImageBuffer(stampPicture);

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
      ["Client Name", "AXIS BANK"],
      ["Name of applicant", task.applicantName],
      ["Application no", task._id],
      ["Product", task.product],
      ["Applicant residence address", task.address],
      ["Applicant mob. No.", task.contactNumber],
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
                  children: [
                    new TextRun({ text: label, bold: true, size: 28 }), // 14pt
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: value || "-", size: 24 }), // 12pt
                  ],
                }),
              ],
            }),
          ],
        })
    );

    const remarkTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Verification Remarks:",
                      bold: true,
                      size: 32, // 16pt
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: remarkText || "N/A",
                      bold: false,
                      size: 24, // 12pt
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    // Example caption used repeatedly
    const imageCaption =
      "Date & Time : Sat May 24 12:08 2025\nLocation : 28.6377841 , 77.2244562";

    // Create the image table rows
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
                // Image
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: buffer,
                      transformation: { width: 250, height: 150 },
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),

                // Caption
                new Paragraph({
                  text: imageCaption,
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

      imageTableRows.push(
        new TableRow({
          children: rowCells,
        })
      );
    }

    // Final Document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "URMS INDIA PRIVATE LIMITED",
                  bold: true,
                  size: 36, // 18pt
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 200 },
              children: [
                new TextRun({
                  text: "Verification Report",
                  bold: true,
                  size: 32, // 16pt
                }),
              ],
            }),

            // Task Details Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: taskDetails,
            }),

            new Paragraph({ text: " " }),
            remarkTable,

            new Paragraph({ text: " " }),

            // Photographs Title
            new Paragraph({
              children: [
                new TextRun({ text: "Photographs", bold: true, size: 28 }),
              ],
              spacing: { before: 300, after: 100 },
            }),

            // Image Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: imageTableRows,
            }),

            new Paragraph({ text: " " }),

            // Signature Section
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Sign And Stamp",
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { before: 300, after: 100 },
            }),

            // Stamp Image
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: stampBuffer,
                  transformation: {
                    width: 200,
                    height: 100,
                  },
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

  const generatePDF = (task) => {
    const remark = getRemarkForTask(task._id);
    const remarkText = remark?.remark || "No Remark";

    const selectedImages = getAllImages(remark) || [];
    const groups = [];
    for (let i = 0; i < selectedImages.length; i += 3) {
      const group = selectedImages.slice(i, i + 3);
      const groupHtml = `
      <div class="img-group">
        ${group
          .map(
            (img) => `
              <div class="img-box">
                <div class="img-caption">${"Date & Time : Sat May 24 12:08 2025<br>Location : 28.6377841 , 77.2244562"}</div>
                <img src="${img}" alt="Image" />
              </div>
            `
          )
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
            padding: 10px;
        }

        .pdf-main-container {
            width: 70%;
            margin: 0 auto;
            padding: 15px;
            border: 1px solid #000;
            background-color: #fff;
        }

        .center-text {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
            margin: 4px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
            font-size: 12px;
        }

        .remarks-title {
            text-align: center;
            font-weight: bold;
            background-color: #e2e2e2;
            border: 1px solid #000;
            padding: 6px;
            margin-top: 15px;
            text-transform: uppercase;
        }

        .remarks-section {
            border: 1px solid #000;
            padding: 10px;
            margin-top: -1px;
            background-color: #fdfdfd;
            line-height: 1.5;
        }

        .img-group {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin-top: 20px;
        }

        .img-box {
            width: 32%;
            border: 1px solid #000;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background-color: #f9f9f9;
            position: relative;
        }

        .img-caption {
            font-size: 10px;
            text-align: center;
            padding: 6px;
            font-weight: bold;
          background-color: rgba(0, 0, 0, 0.6);
            max-width: 90%;
            margin: auto;
            color: white;
            border-radius: 5px;
            position: absolute;
            bottom: 10px;
            right: 10px;
        }

        .img-box img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
        }

        .signature {
            text-align: center;
            margin-top: 10px;
            font-weight: bold;
        }

        .stamp img {
            margin-top: 2px;
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
                <th>Name of applicant</th>
                <td>${task?.applicantName}</td>
            </tr>
            <tr>
                <th>Application no</th>
                <td>${task._id}</td>
                <th>Product</th>
                <td>${task.product}</td>
            </tr>
            <tr>
                <th>Applicant residence address</th>
                <td>${task.address}</td>
                <th>Applicant mob. No.</th>
                <td>${task.contactNumber}</td>
            </tr>
            <tr>
                <th>Date of receiving</th>
                <td>${task.assignDate}</td>
                <th>Date of reporting</th>
                <td>${new Date().toLocaleDateString()}</td>
            </tr>
        </table>

        <div class="remarks-title">Verification Remarks</div>
        <div class="remarks-section">
          ${remarkText}
        </div>

        <table>
            <tr>
                <th style="text-align: center;">Status</th>
                <th style="text-align: center;">@</th>
            </tr>
            <tr>
                <th colspan="2" style="text-align: center;">Photography</th>
            </tr>
        </table>

          
           ${groups}

        <div class="signature">
            Sign And Stamp
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
                <th scope="col">BN</th>
                <th scope="col">PD</th>
                <th scope="col">Name</th>
                <th scope="col">CNo</th>
                <th scope="col">Address</th>
                <th scope="col">Trig</th>
                <th scope="col">VR</th>
                <th scope="col">Pdf</th>
                <th scope="col">MS Word</th>
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
                      <button
                        className="	btn btn-danger mt-2"
                        onClick={() =>
                          handlePdf(tasks.find((t) => t._id === task._id))
                        }
                      >
                        Download PDF
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() =>
                          generateWordDoc(
                            tasks.find((t) => t._id === task._id),
                          )
                        }
                      >
                        Download Word
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
