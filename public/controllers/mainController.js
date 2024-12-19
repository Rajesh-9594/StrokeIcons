// mainController.js

//filterIcons
function filterIcons(filter) {
    const fileList = document.getElementById('fileList');
    const listItems = fileList.querySelectorAll('li');

    listItems.forEach(listItem => {
        const svgContainer = listItem.querySelector('.svg-container');
        const isApproved = svgContainer && svgContainer.dataset.approved === 'true';

        if (filter === 'approved' && isApproved) {
            listItem.style.display = 'block';
        } else if (filter === 'pending' && !isApproved) {
            listItem.style.display = 'block';
        } else if (filter === '') {
            listItem.style.display = 'block';
        } else {
            listItem.style.display = 'none';
        }
    });
    
}

const strokeColorPath1 = document.getElementById("strokeColorPath1");
const strokeColorPath2 = document.getElementById("strokeColorPath2");
const strokeWidthInput = document.getElementById("strokeWidth");
const fillCheckbox = document.getElementById("fillCheckbox");

let globalStrokeColorPath1 = '#000000';
let globalStrokeColorPath2 = '#fa6400';
let globalStrokeWidth = '5';
let globalFillCheckbox = true;

function updateGlobalColors() {
    globalStrokeColorPath1 = strokeColorPath1.value;
    globalStrokeColorPath2 = strokeColorPath2.value;
    globalStrokeWidth = strokeWidthInput.value;
    globalFillCheckbox = fillCheckbox.checked;

    const allIcons = document.querySelectorAll('.svg-container');
    allIcons.forEach((svgContainer) => {
        updateIconStyles(svgContainer);
    });
}

function updateIconStyles(svgContainer) {
    try {
        if (!svgContainer) {
            console.error("svgContainer is null or undefined");
            return;
        }

        const allPath1 = svgContainer.querySelectorAll(".path1");
        const allPath2 = svgContainer.querySelectorAll(".path2");
        const fillValue = globalFillCheckbox ? "none" : "";

        allPath1.forEach((path) => {
            if (path && path.style) {
                path.style.stroke = globalStrokeColorPath1;
                path.style.fill = fillValue;
                path.style.strokeWidth = globalStrokeWidth + 'px';
            }
        });

        allPath2.forEach((path) => {
            if (path && path.style) {
                path.style.stroke = globalStrokeColorPath2;
                path.style.fill = fillValue;
                path.style.strokeWidth = globalStrokeWidth + 'px';
            }
        });
    } catch (error) {
        console.error(`Error updating icon styles: ${error}`);
    }
}

strokeColorPath1.addEventListener("input", updateGlobalColors);
strokeColorPath2.addEventListener("input", updateGlobalColors);
strokeWidthInput.addEventListener("input", updateGlobalColors);
fillCheckbox.addEventListener("change", updateGlobalColors);
// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // DOM elements

    const iconSizeSelect = document.getElementById("iconSize");
    var openModalBtn = document.getElementById('openModalBtn');
    var modal = document.getElementById('myModal');
    var closeModalSpan = document.getElementsByClassName('close')[0];
    const approvalFilter = document.getElementById('approvalFilter');
    const messageNotification = document.querySelector('.message-notification');

    let previousSearchTerm = '';
// Pagination controls
const paginationContainer = document.getElementById("paginationContainer");

// Icons per page
const iconsPerPage = 8;

// Current page
let currentPage = 1;

let totalPages = 0;

// Event listener for pagination controls
document.addEventListener("click", (event) => {
    if (event.target.tagName === "A" && event.target.parentNode.classList.contains("pagination")) {
        const targetPage = parseInt(event.target.dataset.page);
        if (!isNaN(targetPage) && targetPage !== currentPage) {
            loadIcons(targetPage);
        }
    }
});

// Icons container
const iconsContainer = document.getElementById("fileList");

let userInfo;
// Function to create UI elements for an icon
function createIconUI(file, index) {
    const listItem = document.createElement("li");


    fetch(file.filepath)
        .then((response) => response.text())
        .then((svgContent) => {
            const svgContainer = document.createElement("div");
            svgContainer.classList.add("svg-container");
            svgContainer.dataset.index = index;
            svgContainer.dataset.approved = file.approved ? 'true' : 'false';

            const svgItem = document.createElement("div");
            svgItem.classList.add("svg-item");
            svgItem.innerHTML = svgContent;
            svgContainer.appendChild(svgItem);

            // Create a container for bottom SVG info
            const bottomSvgInfo = document.createElement("div");
            bottomSvgInfo.classList.add("bottomSvgInfo");

            // Create a download image
            const downloadImage = document.createElement("div");
            downloadImage.classList.add("download-image");

            const downloadIcon = document.createElement("img");
            downloadIcon.src = "../images/download-icon.svg";
            downloadIcon.alt = "Download";

            downloadImage.appendChild(downloadIcon);
            bottomSvgInfo.appendChild(downloadImage);

            // Check if the user is an admin
            if (userInfo && userInfo.role === 'admin') {
                console.log('User is an admin');

                approvalFilter.style.display = 'inline-block';
                //approve button for admins to approve icons
                const approveButton = document.createElement('div');
                approveButton.innerHTML = file.approved ?
                    '<img class="approved-icon" src="../images/double-tick.svg" alt="Approved" />' :
                    '<img class="approve-icon" src="../images/single-tick.svg" alt="Approve" />';
                approveButton.addEventListener('click', () => approveIcon(file._id));
                bottomSvgInfo.appendChild(approveButton);

                // delete button for admins to delete icons
                const deleteButton = document.createElement('div');
                deleteButton.innerHTML = '<img class="delete-image" src="../images/delete-icon.svg" alt="Delete" />';
                deleteButton.addEventListener('click', () => deleteIcon(file._id, index));
                bottomSvgInfo.appendChild(deleteButton);

            } else {

                console.log('User is not an admin');
                approvalFilter.style.display = 'none';
            }
            // Filter icons based on approval status
            if (userInfo && userInfo.role !== 'admin') {
                const approvalFilter = document.getElementById('approvalFilter');
                if ((approvalFilter.value === 'approved' && !file.approved) ||
                    (approvalFilter.value === 'pending' && file.approved)) {
                    listItem.style.display = 'none';
                }
            }

            // Create a download count paragraph
            const downloadCountParagraph = document.createElement('p');
            downloadCountParagraph.classList.add('download-count');
            downloadCountParagraph.textContent = `${file.downloadCount}`;
            downloadImage.appendChild(downloadCountParagraph);

            //click event for download action
            downloadIcon.onclick = function() {
                downloadSvg(index, file);
            };

            // appending bottom SVG info to the container
            svgContainer.appendChild(bottomSvgInfo);

            // Check if the user is available (not null)
            if (file.uploadedBy) {
                // Display the username
                const uploadedByParagraph = document.createElement('p');
                uploadedByParagraph.classList.add('uploaded-by');
                uploadedByParagraph.textContent = `by: ${file.uploadedBy}`;
                svgItem.appendChild(uploadedByParagraph);
            } else {
                // Display a default or placeholder value
                const uploadedByParagraph = document.createElement('p');
                uploadedByParagraph.classList.add('uploaded-by');
                uploadedByParagraph.textContent = 'by: Unknown User';
                svgItem.appendChild(uploadedByParagraph);
            }

            // Create a svg title
            const titleParagraph = document.createElement("p");
            titleParagraph.classList.add("svg-title");
            titleParagraph.textContent = file.title;
            svgContainer.appendChild(titleParagraph);

            listItem.appendChild(svgContainer);
            fileList.appendChild(listItem);

            // Display icons only after approval in user view
            if (userInfo && userInfo.role !== 'admin' && !file.approved) {
                listItem.style.display = 'none';
            }

            const colorInfo = {
                globalStrokeColorPath1,
                globalStrokeColorPath2,
                globalStrokeWidth,
                globalFillCheckbox,
            };

            updateIconStyles(svgContainer, colorInfo);
        })
        .catch((error) => {
            console.error(`Error loading SVG: ${error}`);
            listItem.innerHTML = `<p class="svg-title">${file.title}</p>: Error loading SVG`;
            iconsContainer.appendChild(listItem);
        });
}


// Function to fetch and display icons
async function fetchAndDisplayIcons(page) {
    try {
        // Fetch total count for pagination calculation only when no search term or filter is applied
        if (searchInput.value.trim() === '') {
            // Show pagination for values other than "pending" and "approved"
            if (approvalFilter.value !== 'pending' && approvalFilter.value !== 'approved') {
                const totalCountResponse = await fetch("http://localhost:5000/files/count");
                const totalCount = await totalCountResponse.json();

                // Calculate total pages based on total count and icons per page
                totalPages = Math.ceil(totalCount / iconsPerPage);

                // Ensure the current page is within valid bounds
                if (page < 1) {
                    page = 1;
                } else if (page > totalPages) {
                    page = totalPages;
                }

                // Fetch icons data from the server
                const response = await fetch(`http://localhost:5000/files?page=${page}&pageSize=${iconsPerPage}`);
                const files = await response.json();


              
                // Update the UI with the fetched icons
                iconsContainer.innerHTML = "";
                try {
                    // Fetch user information
                    const userInfoResponse = await fetch("/get-user-info");
                    userInfo = await userInfoResponse.json();

                    console.log('User Info:', userInfo);
                } catch (userInfoError) {
                    console.error('Error fetching user info:', userInfoError);
                }

                // Loop through files and create UI for each icon
                files.forEach((file, index) => {
                    createIconUI(file, index);
                });

                // Update the current page
                currentPage = page;

                //total count in database
                const totalCountSpan = document.getElementById('totalCount');
                totalCountSpan.textContent = totalCount;

                // Show/hide pagination controls based on the filter
                const isFilterActive = approvalFilter.value !== '';
                paginationContainer.style.display = isFilterActive ? 'none' : 'block';

                // Update pagination controls for regular results
                updatePaginationControls(currentPage, totalPages);
            } else {
                // Hide pagination controls when the filter is "pending" or "approved"
                paginationContainer.style.display = 'none';
            }
        } else {
            // Hide pagination controls when there is a search term
            paginationContainer.style.display = 'none';
        }
    } catch (error) {
        console.error("Error fetching icons:", error);
    }
}


// Function to update pagination controls
function updatePaginationControls(currentPage, totalPages) {
    const paginationContainer = generatePaginationControls(currentPage, totalPages);
    const existingPaginationContainer = document.getElementById("paginationContainer");

    existingPaginationContainer.innerHTML = "";

    // Check if the selected filter is neither "Pending Icons" nor "Approved Icons" and there is no search term
    const isAllIconsFilter = approvalFilter.value !== 'pending' && approvalFilter.value !== 'approved';
    const isSearchActive = searchInput.value.trim() !== '';

    // Append the pagination controls only when the criteria are met
    if (isAllIconsFilter && !isSearchActive) {
        existingPaginationContainer.appendChild(paginationContainer);

        paginationContainer.addEventListener("click", (event) => {
            event.preventDefault();
            const targetPage = parseInt(event.target.dataset.page);

            if (!isNaN(targetPage)) {
                loadIcons(targetPage);
            } else if (event.target.getAttribute("aria-label") === "Previous") {
                loadIcons(currentPage - 1);
            } else if (event.target.getAttribute("aria-label") === "Next") {
                loadIcons(currentPage + 1);
            }
        });
    }
}






// Function to generate pagination controls with previous and next buttons
function generatePaginationControls(currentPage, totalPages) {
    const paginationContainer = document.createElement("ul");
    paginationContainer.classList.add("pagination");

    // Previous button
    const previousButton = document.createElement("li");
    previousButton.innerHTML = `<a class="previous-pagination" href="#" aria-label="Previous" data-page="${currentPage - 1}">&laquo;</a>`;
    paginationContainer.appendChild(previousButton);

    // Page buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("li");
        pageButton.innerHTML = `<a href="#" data-page="${i}">${i}</a>`;
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        paginationContainer.appendChild(pageButton);
    }

    // Next button
    const nextButton = document.createElement("li");
    nextButton.innerHTML = `<a class="next-pagination" href="#" aria-label="Next" data-page="${currentPage + 1}">&raquo;</a>`;
    paginationContainer.appendChild(nextButton);

    return paginationContainer;
}



// Function to load icons based on pagination
async function loadIcons(page) {
    try {
        await fetchAndDisplayIcons(page);
    } catch (error) {
        console.error("Error loading icons:", error);
    }
}

// Event listener for approval filter
approvalFilter.addEventListener('change', async function () {
    const filter = approvalFilter.value;

    try {
        // Fetch total count for pagination calculation
        const totalCountResponse = await fetch(`http://localhost:5000/files/count?approvalStatus=${filter}`);
        const totalCount = await totalCountResponse.json();

        // Calculate total pages based on total count and icons per page
        totalPages = Math.ceil(totalCount / iconsPerPage);

        // Fetch icons data from the server with the filter parameter
        const response = await fetch(`http://localhost:5000/files?page=${currentPage}&pageSize=${iconsPerPage}&approvalStatus=${filter}`);
        const files = await response.json();

        // Update the UI with the fetched icons
        iconsContainer.innerHTML = "";
        try {
            // Fetch user information
            const userInfoResponse = await fetch("/get-user-info");
            userInfo = await userInfoResponse.json(); 

            console.log('User Info:', userInfo);
        } catch (userInfoError) {
            console.error('Error fetching user info:', userInfoError);
        }

        // Loop through files and create UI for each icon
        files.forEach((file, index) => {
            createIconUI(file, index);
        });

        //total count in database
        const totalCountSpan = document.getElementById('totalCount');
        totalCountSpan.textContent = files.length;

        // Update pagination controls for regular results
        updatePaginationControls(currentPage);
    } catch (error) {
        console.error("Error fetching icons:", error);
    }
});

// Initial load
fetchAndDisplayIcons(currentPage);

// Search functionality
searchInput.addEventListener('input', async function () {
    const searchTerm = searchInput.value.toLowerCase();

    // Check if the search term has changed
    if (searchTerm !== previousSearchTerm) {
        // Reset pagination state
        currentPage = 1;
        previousSearchTerm = searchTerm;
    }

    // Check if there is a search term
    if (searchTerm.trim() !== '') {
        try {
            // Fetch total count for pagination calculation
            const totalCountResponse = await fetch(`/files/search/count?term=${searchTerm}`);
            const totalCount = await totalCountResponse.json();

            // Calculate total pages based on total count and icons per page
            totalPages = Math.ceil(totalCount / iconsPerPage);

            // Fetch icons based on the search term and pagination parameters
            const response = await fetch(`/search?term=${searchTerm}&page=${currentPage}&pageSize=${iconsPerPage}`);
            const searchResults = await response.json();

            // Update the UI with the search results
            iconsContainer.innerHTML = "";
            searchResults.forEach((file, index) => {
                createIconUI(file, index);
            });

            // Update pagination controls for search results
            updatePaginationControls(currentPage, totalPages);
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    } else {
        // Fetch and display all icons when the search term is empty
        await fetchAndDisplayIcons(currentPage);
    }
});

async function approveIcon(iconId) {
    try {
        const response = await fetch(`/approve-icon/${iconId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (result.success) {
            // Success case
            messageNotification.textContent = 'Icon approved successfully!';
            messageNotification.style.display = 'block';

            // Timeout to remove the success message after a few seconds
            setTimeout(() => {
                messageNotification.textContent = '';
                messageNotification.style.display = 'none';
            }, 3000);

            // Update the UI instantly after approval
            const svgContainer = document.querySelector(`.svg-container[data-index="${result.index}"]`);

            if (svgContainer) {
                // Update the dataset and replace the approve button with the approved icon
                svgContainer.dataset.approved = 'true';

                const approveButton = svgContainer.querySelector('.approved-icon');
                if (approveButton) {
                    approveButton.src = '../images/double-tick.svg';
                    approveButton.alt = 'Approved';
                } else {
                    // If the approved-icon is not present, add it
                    const newApprovedIcon = document.createElement('img');
                    newApprovedIcon.classList.add('approved-icon');
                    newApprovedIcon.src = '../images/double-tick.svg';
                    newApprovedIcon.alt = 'Approved';
                    svgContainer.querySelector('.svg-item').appendChild(newApprovedIcon);
                }
            }
 // Refresh the icons after approval
 await fetchAndDisplayIcons();
            
            console.log(result.message);
        } else {
            // Error case
            messageNotification.textContent = result.message;
            messageNotification.style.display = 'block';

            messageNotification.classList.add('error-message');

            // Timeout to remove the error message after a few seconds
            setTimeout(() => {
                messageNotification.textContent = '';
                messageNotification.classList.remove('error-message');
                messageNotification.style.display = 'none';
            }, 3000);

            // Handle the case where the approval was not successful
            console.error(result.message);
        }
    } catch (error) {
        console.error('Error approving icon:', error);
    }
}

    //  deleteIcon function 
    async function deleteIcon(iconId, index) {
        try {
            // Display a confirmation dialog
            const userConfirmation = confirm("Are you sure you want to delete this icon?");

            if (!userConfirmation) {
                return; // User canceled the deletion
            }

            const response = await fetch(`/icons/${iconId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (result.success) {
                // Removing the deleted icon from the UI
                const svgContainer = document.querySelector(`.svg-container[data-index="${index}"]`);
                if (svgContainer) {
                    svgContainer.remove();
                }

                //total count span update
                const totalCountSpan = document.getElementById('totalCount');
                totalCountSpan.textContent = parseInt(totalCountSpan.textContent, 10) - 1;

                console.log(result.message);
            } else {
                console.error(result.message);
            }
        } catch (error) {
            console.error('Error deleting icon:', error);
        }
    }

    // Function to download SVG as PNG and update download count
    function downloadSvg(index, file) {
        const selectedSize = parseInt(iconSizeSelect.value, 10);
        if (isNaN(selectedSize) || selectedSize <= 0) {
            alert('Please select a valid size.');
            return;
        }

        const svgContainer = document.querySelector(`.svg-container[data-index="${index}"]`);
        const icon = svgContainer.querySelector('svg');

        if (icon) {
            updateIconStyles(icon);


            const canvas = document.createElement('canvas');
            canvas.width = selectedSize;
            canvas.height = selectedSize;
            const ctx = canvas.getContext('2d');

            const svgData = new XMLSerializer().serializeToString(icon);

            const img = new Image();
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);

            img.onload = function() {
                ctx.drawImage(img, 0, 0, selectedSize, selectedSize);

                const dataURL = canvas.toDataURL('image/png');

                // Increment download count on the server
                fetch(`/download/${file._id}`, {
                        method: 'GET',
                    })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then((result) => {
                        console.log(result.message);

                        // Trigger the download after incrementing the count
                        const a = document.createElement('a');
                        a.href = dataURL;
                        a.download = `${file.title}_${selectedSize}x${selectedSize}.png`;
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    })
                    .catch((error) => {
                        console.error('Error downloading icon:', error);
                    });
            };
        }
    }

    // Open modal on button click
    openModalBtn.onclick = function() {
        modal.style.display = 'block';
    };

    // Close modal on span click
    closeModalSpan.onclick = function() {
        modal.style.display = 'none';
    };

    // Close modal on outside click
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    const dropdownContent = document.querySelector('.dropdown-content');

    dropdownTrigger.addEventListener('click', function () {
        dropdownContent.classList.toggle('show');
    });


});



