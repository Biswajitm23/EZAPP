### EZ APP 
# Tech stack 
- React Native expo App 



### Editing From  
     /EMPAPP only 

### For Reference 
    /OLDAPP


<!-- # Requirements:

## DASHBOARD 

1.  Need to Remove Search Panel & The bitpastel logo from the Dashboard 
2.  Connect the Profile Picture from the API response 
3.  Change the Hello Text to Good Morning, Good Afternoon, Good Evening greetings as per the time zone 
4.  Change Notification ICON to DARK & Light Mode Button and make it Functional 
5.  Please Check The "DashboardListDesign.png" file from Refernce folder and make the Card Design Like the same image Do not change the Color      Combination what i used in the App Based on the API Response need to Add Image Design + Title Design + Instead of Price here in App Need to add Button "label": "Viewed",  this with a Slider functionality which is Suitable for Mobile Application as per my Project stack 
6.  Dashboard Content API Response :
                                    {
    "status": true,
    "meta": {
        "user_type": "Employee",
        "asset_base_url": "https://bitpastel.org/employee-zone/",
        "tabs": [
            {
                "key": "all",
                "title": "All"
            },
            {
                "key": "e_learning_videos",
                "title": "E-Learning Videos"
            },
            {
                "key": "compliance",
                "title": "Compliance"
            },
            {
                "key": "careers",
                "title": "Careers"
            },
            {
                "key": "guidelines",
                "title": "Guidelines"
            },
            {
                "key": "weekly_games",
                "title": "Weekly Games"
            },
            {
                "key": "rewards",
                "title": "Rewards"
            },
            {
                "key": "presentations",
                "title": "Presentations"
            },
            {
                "key": "social",
                "title": "Social"
            }
        ]
    },
    "sections": {
        "e_learning_videos": {
            "key": "e_learning_videos",
            "title": "E-Learning Videos",
            "tracks_viewed": true,
            "count": 3,
            "items": [
                {
                    "key": "induction_video",
                    "title": "Induction",
                    "image": "https://bitpastel.org/employee-zone/assets/image/Induction.jpg",
                    "link": "https://bitpastel.org/employee-zone/dashboard/induction-video",
                    "link_type": "internal",
                    "viewed": true,
                    "label": "Viewed",
                    "detail": {
                        "type": "elearning_video",
                        "key": "induction_video"
                    }
                },
                {
                    "key": "remote_working_video",
                    "title": "Remote Working",
                    "image": "https://bitpastel.org/employee-zone/assets/image/Remote_working.jpg",
                    "link": "https://bitpastel.org/employee-zone/dashboard/elearning-remote-work",
                    "link_type": "internal",
                    "viewed": true,
                    "label": "Viewed",
                    "detail": {
                        "type": "elearning_video",
                        "key": "remote_working_video"
                    }
                },
                {
                    "key": "apdr_video",
                    "title": "APDR",
                    "image": "https://bitpastel.org/employee-zone/assets/image/APDR.jpg",
                    "link": "https://bitpastel.org/employee-zone/dashboard/elearning-apdr",
                    "link_type": "internal",
                    "viewed": true,
                    "label": "Viewed",
                    "detail": {
                        "type": "elearning_video",
                        "key": "apdr_video"
                    }
                }
            ]
        },
        "compliance": {
            "key": "compliance",
            "title": "Compliance",
            "tracks_viewed": true,
            "count": 2,
            "items": [
                {
                    "key": "forms",
                    "title": "Forms",
                    "image": "https://bitpastel.org/employee-zone/assets/image/Forms.jpg",
                    "link": "https://bitpastel.org/employee-zone/dashboard/employee-form",
                    "link_type": "internal",
                    "viewed": null,
                    "label": "Pending",
                    "status": "Pending",
                    "total_forms": 6,
                    "submitted_forms": 0,
                    "detail": {
                        "type": "form_list"
                    }
                },
                {
                    "key": "hr_handbook",
                    "title": "HR HandBook",
                    "image": "https://bitpastel.org/employee-zone/assets/image/HR_HandBook.jpg",
                    "link": "https://bitpastel.org/employee-zone/dashboard/hr-handbook",
                    "link_type": "internal",
                    "viewed": true,
                    "label": "Viewed",
                    "detail": {
                        "type": "hr_handbook"
                    }
                }
            ]
        },
        "careers": {
            "key": "careers",
            "title": "Careers",
            "tracks_viewed": false,
            "count": 1,
            "items": [
                {
                    "key": "internal_mobility",
                    "title": "Internal Mobility",
                    "image": "https://bitpastel.org/employee-zone/assets/image/Internal_mobility.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/internal-mobility",
                    "link_type": "internal",
                    "viewed": null,
                    "label": "View"
                }
            ]
        },
        "guidelines": {
            "key": "guidelines",
            "title": "Guidelines",
            "tracks_viewed": true,
            "count": 9,
            "items": [
                {
                    "key": "guideline_19",
                    "title": "Collaboration - Switch",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/ee358a255851b0a571cbd27ebd856bba.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/guidelines/collaboration---switch",
                    "link_type": "internal",
                    "viewed": false,
                    "label": "View",
                    "detail": {
                        "type": "guideline",
                        "slug": "collaboration---switch"
                    }
                },
                {
                    "key": "guideline_17",
                    "title": "Professional Conduct Guidelines",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/d6c47a5c92975b0d9cec9374df3fcbe7.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/guidelines/professional-conduct-guidelines",
                    "link_type": "internal",
                    "viewed": false,
                    "label": "View",
                    "detail": {
                        "type": "guideline",
                        "slug": "professional-conduct-guidelines"
                    }
                },
                {
                    "key": "guideline_16",
                    "title": "Instructions for sharing files on drive",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/244cb0e397db1fbd2ea0b8033216139f.jpg",
                    "link": "https://bitpastel.org/employee-zone/dashboard/guidelines/instructions-for-sharing-files-on-drive",
                    "link_type": "internal",
                    "viewed": true,
                    "label": "Viewed",
                    "detail": {
                        "type": "guideline",
                        "slug": "instructions-for-sharing-files-on-drive"
                    }
                },
                {
                    "key": "guideline_15",
                    "title": "Work Status Reporting Guidelines",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/ac1003041de071d472c1338392fb827e.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/guidelines/work-status-reporting-guidelines",
                    "link_type": "internal",
                    "viewed": false,
                    "label": "View",
                    "detail": {
                        "type": "guideline",
                        "slug": "work-status-reporting-guidelines"
                    }
                },
                {
                    "key": "guideline_14",
                    "title": "Email Format",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/1717525ec2b87701480d04d17370ab0b.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/guidelines/email-format",
                    "link_type": "internal",
                    "viewed": true,
                    "label": "Viewed",
                    "detail": {
                        "type": "guideline",
                        "slug": "email-format"
                    }
                },
                {
                    "key": "guideline_8",
                    "title": "How to send G-Meet Invite",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/fc8521f66513b7ecaddf5b89ca972667.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/guidelines/how-to-send-g-meet-invite",
                    "link_type": "internal",
                    "viewed": false,
                    "label": "View",
                    "detail": {
                        "type": "guideline",
                        "slug": "how-to-send-g-meet-invite"
                    }
                },
                {
                    "key": "guideline_3",
                    "title": "Bitpastel Onboarding",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/740f7548000e65f415e0dac6f9808037.jpg",
                    "link": "https://bitpastel.org/employee-zone/dashboard/guidelines/bitpastel-onboarding",
                    "link_type": "internal",
                    "viewed": false,
                    "label": "View",
                    "detail": {
                        "type": "guideline",
                        "slug": "bitpastel-onboarding"
                    }
                },
                {
                    "key": "guideline_2",
                    "title": "Remote Working Guidelines",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/43ed3117bd51b30466b5aac0a15e641f.jpg",
                    "link": "https://bitpastel.org/employee-zone/dashboard/guidelines/remote-working-guidelines",
                    "link_type": "internal",
                    "viewed": false,
                    "label": "View",
                    "detail": {
                        "type": "guideline",
                        "slug": "remote-working-guidelines"
                    }
                },
                {
                    "key": "guideline_1",
                    "title": "Instructions for IT Equipment Care",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/e7c9ba86cda416669fbb4fc90c727cfa.jpg",
                    "link": "https://bitpastel.org/employee-zone/dashboard/guidelines/instructions-for-it-equipment-care",
                    "link_type": "internal",
                    "viewed": false,
                    "label": "View",
                    "detail": {
                        "type": "guideline",
                        "slug": "instructions-for-it-equipment-care"
                    }
                }
            ]
        },
        "weekly_games": {
            "key": "weekly_games",
            "title": "Weekly Games",
            "tracks_viewed": false,
            "count": 2,
            "items": [
                {
                    "key": "game_26",
                    "title": "Weekly Jackpot",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/1692945181772.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/games/weekly-jackpot",
                    "link_type": "internal",
                    "viewed": null,
                    "label": "View",
                    "detail": {
                        "type": "game",
                        "slug": "weekly-jackpot"
                    }
                },
                {
                    "key": "game_25",
                    "title": "Weekly Lead Magnet",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/1692945128768.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/games/weekly-lead-magnet",
                    "link_type": "internal",
                    "viewed": null,
                    "label": "View",
                    "detail": {
                        "type": "game",
                        "slug": "weekly-lead-magnet"
                    }
                }
            ]
        },
        "rewards": {
            "key": "rewards",
            "title": "Rewards",
            "tracks_viewed": false,
            "count": 4,
            "items": [
                {
                    "key": "reward_30",
                    "title": "How To Earn Bitpoints",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/1704714175332.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/rewards/how-to-earn-bitpoints",
                    "link_type": "internal",
                    "viewed": null,
                    "label": "View",
                    "detail": {
                        "type": "reward",
                        "slug": "how-to-earn-bitpoints"
                    }
                },
                {
                    "key": "reward_24",
                    "title": "Employee Referral Bonus",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/1692703665834.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/rewards/employee-referral-bonus",
                    "link_type": "internal",
                    "viewed": null,
                    "label": "View",
                    "detail": {
                        "type": "reward",
                        "slug": "employee-referral-bonus"
                    }
                },
                {
                    "key": "reward_23",
                    "title": "Bit Store Brochure",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/1660659125279.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/rewards/bit-store-brochure",
                    "link_type": "internal",
                    "viewed": null,
                    "label": "View",
                    "detail": {
                        "type": "reward",
                        "slug": "bit-store-brochure"
                    }
                },
                {
                    "key": "reward_21",
                    "title": "Bit Store Form",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/1656083996255.png",
                    "link": "https://bitpastel.org/employee-zone/dashboard/rewards/bit-store-form",
                    "link_type": "internal",
                    "viewed": null,
                    "label": "View",
                    "detail": {
                        "type": "reward",
                        "slug": "bit-store-form"
                    }
                }
            ]
        },
        "presentations": {
            "key": "presentations",
            "title": "Presentations",
            "tracks_viewed": false,
            "count": 1,
            "items": [
                {
                    "key": "all_presentations",
                    "title": "All Presentations",
                    "image": "https://bitpastel.org/employee-zone/assets/image/Presentation.jpg",
                    "link": "https://bitpastel.org/employee-zone/dashboard/presentations",
                    "link_type": "internal",
                    "viewed": null,
                    "label": "View",
                    "detail": {
                        "type": "presentation_topics"
                    }
                }
            ]
        },
        "social": {
            "key": "social",
            "title": "Social",
            "tracks_viewed": false,
            "count": 3,
            "items": [
                {
                    "key": "social_29",
                    "title": "LinkedIn",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/1694060255771.png",
                    "link": "https://www.linkedin.com/company/bitpastel/",
                    "link_type": "external",
                    "viewed": null,
                    "label": "View"
                },
                {
                    "key": "social_28",
                    "title": "Instagram",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/1694060187197.png",
                    "link": "https://instagram.com/bitpastel.io?igshid=MzRlODBiNWFlZA==",
                    "link_type": "external",
                    "viewed": null,
                    "label": "View"
                },
                {
                    "key": "social_27",
                    "title": "Facebook",
                    "image": "https://bitpastel.org/employee-zone/admin/uploads/form_images/1694059721429.png",
                    "link": "https://www.facebook.com/bitpastel?mibextid=ZbWKwL",
                    "link_type": "external",
                    "viewed": null,
                    "label": "View"
                }
            ]
        }
    }
}
          
7.  Please Make Sure On Loading State Please use Skeleton Loader 
8.  Handle the Empty State 
9.  On The Bottom Add Category Video, Pdf and Forms and make here also the Items filterly shows from APP Take Response and make the Logic 
10. Details For Video 
    Employee Induction

┌────────────────────────┐
│        VIDEO           │
│        iframe          │
│        ▶               │
└────────────────────────┘

🌐 Language
[ English ▼ ]

Duration • 12 min

Description
Welcome to employee onboarding...

☐ I have completed watching
the full {title} video

[ Confirm Completion ]       

11. Please check the refernce of CheckBoxDesign.png for Check Box Design Make Fuctional All checkbox Hit API Suppose 
    For Video: 
        POST /elearning/watched
        body { "key":"apdr_video" }
    For PDF: 
        POST /hr-handbook/read
        body { "handbook_id": <id> }
    For Form:
        POST /forms/submit
        body { "form_id": <id> }
12. Dashboard API MAP Sheet 
    1. E-Learning Videos
            Card Behavior
            Show View if not watched
            Show Viewed after completion
            Open Details Page → Video Player + Language Selector + Confirm Checkbox
            Induction
            Item	Value
            Dashboard Endpoint	dashboard/induction-video
            Detail API	GET /dashboard/detail?type=elearning_video&key=induction_video
            Action API	POST /elearning/watched
            Body	{ "key":"induction_video" }
            UI	Video iframe → Select Language → Checkbox → Confirm
            Response Notes	languages[], embed=<iframe>, watched
            Remote Working
            Item	Value
            Dashboard Endpoint	dashboard/elearning-remote-work
            Detail API	GET /dashboard/detail?type=elearning_video&key=remote_working_video
            Action API	POST /elearning/watched
            Body	{ "key":"remote_working_video" }
            UI	Same as Induction
            APDR
            Item	Value
            Dashboard Endpoint	dashboard/elearning-apdr
            Detail API	GET /dashboard/detail?type=elearning_video&key=apdr_video
            Action API	POST /elearning/watched
            Body	{ "key":"apdr_video" }
            UI	Same as Induction
            Details Screen Flow (E-Learning)
            Dashboard Card
            ↓
            View
            ↓
            GET Detail API
            ↓
            Open Detail Page
            ↓
            Load iframe
            ↓
            Select Language
            ↓
            Watch Video
            ↓
            Checkbox Enabled
            ↓
            Confirm
            ↓
            POST watched
            ↓
            Dashboard refresh
            ↓
            Viewed
    2. Compliance → Forms
            Aggregate Card
            Item	Value
            Employee	dashboard/employee-form
            Intern	dashboard/intern-form
            Detail API	GET /dashboard/detail?type=form_list
            Action API	POST /forms/submit
            Body	{ "form_id": <id> }
            UI
            Compliance
            Submitted 3 / 5
            ↓
            Open Forms
            ↓
            Google Form
            ↓
            Checkbox Confirm
            ↓
            Submit
            Open Single Form
            Item	Value
            Dashboard	dashboard/employee-form/<slug>
            Detail API	GET /dashboard/detail?type=form&slug=<slug>
            Action API	POST /forms/submit
            Without Signature
            {
            "form_id": 10
            }
            With Signature
            {
            "form_id":10,
            "signature_image":"base64"
            }

            Response:

            embed_url
            file_url
            needs_signature
            submit
    3. HR Handbook
            Item	Value
            Dashboard	dashboard/hr-handbook
            Detail API	GET /dashboard/detail?type=hr_handbook
            Action API	POST /hr-handbook/read
            Body	{ "handbook_id": <id> }
            UI Flow
            Open PDF
            ↓
            Read
            ↓
            Checkbox
            ↓
            Confirm Read
            ↓
            Mark Viewed
    4. Careers → Internal Mobility
            Item	Value
            Dashboard	dashboard/internal-mobility
            Detail	Static
            Action	None

            UI:

            Native Screen
            OR
            WebView

            Subpages:

            Marketing
            WordPress
            Backend
            Shopify
    5. Guidelines
            Item	Value
            Dashboard	dashboard/guidelines/<slug>
            Detail API	GET /dashboard/detail?type=guideline&slug=<slug>
            Action API	POST /guidelines/confirm

            Body:

            {
            "guideline_id":10,
            "signature_image":"base64"
            }
    6. Weekly Games
            Item	Value
            Dashboard	dashboard/games/<slug>
            Detail API	GET /dashboard/detail?type=game&slug=<slug>
            Action	None
    8. Presentations
            All Topics
            Item	Value
            Dashboard	dashboard/presentations
            Detail API	GET /dashboard/detail?type=presentation_topics

            Returns:

            topics[]
            └── pdfs[]
            Open Topic
            GET /dashboard/detail?type=presentation&id=<id>
            Open PDF
            GET /dashboard/detail?type=presentation_pdf&id=<id>
    9. Social
            Item	Value
            Dashboard	item.link
            Detail	External URL
            Action	None

            Flow:

            Card Click
            ↓
            Open Browser
            ↓
            External Link

13. Details For PDF:

    Title
    ┌────────────────────────┐
    │      PDF Show 1 Page        │
    │        iframe          │
    │        ▶               │
    └────────────────────────┘

    🌐 Language
    [ English ▼ ]

    Pages • 1 


    ☐ I confirm i have read the guidelines 

    [ Confirm Completion ]
14. Please check WEBAPPForm.png image In our Refernce folder and map the APi data of Forms 
    API:
        Compliance	
        Forms  
        (single aggregate card)	
        Aggregate: status Pending / Submitted (not a per-item tag)	
        "dashboard/employee-form  (Employee), dashboard/intern-form  (Intern)"	
        GET /dashboard/detail?type=form_list	
        "POST /forms/submit body { ""form_id"": <id> }"	
        Ready. Card shows status + total_forms / submitted_forms. form_list returns every form with submitted + detail{type:form,slug}.
    Please integrate Compliance section 
    Design Should accomodocate the system updated design 
    Form Details Google Form Design need to integrate innovative idea 
    Illustration
    ↓
    Content
    ↓
    Completion Card
    ↓
    CTA
15. Internal Mobility Details Static data add See the Mobility Details.png for content & Mobility Job content.png 
16. Remove Reward Part form Dashboard Content Hide it 
17. Social Link Design need to update use Suitable Icons For Linked in , facebook, Instagram Linkable them 
18. presentation Card design is not implemented please accomodate it 


## Bitponts to Collab Day

1. Need to Remove Bitpoints from the Nav Insted of Make it Calender icon with text Collab Days Where We should implement New section where employee can check which date employee have their Collab Date 

2. Design:
    In the Main Card Showing the Latest Data Suppose Today is 9-06-2026 I have Collab Day Tomorrow then Main Card Show 10-06-2026 Data then i have 11-06-2026 that time on 10-06-2026 after 11:00 AM Indian time need to change for Next days List show default 


3. API:
    GET	/collaboration	
    Bearer	any logged-in	
    Authorization: Bearer <access_token from POST /api/login>	"month, year   (default = latest uploaded month)
    e.g.  /api/collaboration?month=6&year=2026"	"{
    ""status"": true,
    ""available"": true,
    ""month"": ""2026-06"",
    ""title"": ""June 2026 Collaboration Matrix"",
    ""total_office_days"": 15,
    ""days"": [
        { ""date"":""2026-06-02"",""weekday"":""Tue"",""status"":""Working Day"",""ws"":11,""room"":""Room 19"" },
        { ""date"":""2026-06-05"",""weekday"":""Fri"",""status"":""Working Day (Tester Day)"",""ws"":9,""room"":""Room 19"" }
    ],
    }"	401 token missing/invalid

    4. Back Navigation 
    5. Show 10 data After infinite scroll

## Incentive 

1. change incentive Text to Reward on Nav only
2. Back Navigation 
3. Show 10 data After infinite scroll 





## LogIn 

1. When user write the input fields the section overlaped by the keyboard Please make scroll 

### Generic 

- Please Accomodate Skeleton loader for all loading state 
- Use Inovative animation for Mobile App
- Implement Redux , Tenstak query for better performance 
- Make this APP Android & IOS friendly 
- Design & Animation should looks good transition, skelton looks good
- If you see any broken section fix this 
- After Testing Remove Testing Data from codebase 
- Remove unwanted Codes 
- Please make sure this APP should be bug free 
- Remove Unused files 
- Remove After completion of run the Testing documents, screensorts,  code , MD files  -->



<!-- ### Feedback need to Implement 

1. Hide Dark Light Theme button and the app System Default also not take the theme 

2. Hide Internal Mobility form the Dashboard 

3. Remove or delete the All, Video, PDF, Form Filter from Dashboard

4. Please update the Slider make like i have attached on Refernce folder Slider Refernce.png image in hotstart it was implemented 

5. Please check the Issue folder Issue1.png image The PDF Not Showing Properly 
6. Issue folder Issue2.png need to Show 1 slide If PDF has 10 pages then 10 Slides show 1 by 1 user can Swipe no auto Slide 

7. In splash Screen There is a small bug Those phone not loaded the First Animation that time Splash screen showing a White screen please fix refer the Issue folder SplashScreen issue

8.  Please Show the Same FORM List DATA Like WEB refer WEBAPPForm.png

    Forms APi Response:
                {
            "url": "dashboard/detail",
            "method": "GET",
            "status": 200,
            "data": {
                "status": true,
                "type": "form_list",
                "items": [
                {
                    "id": "19",
                    "name": "Employee Information Form",
                    "slug_name": "employee-information-form-1",
                    "image": "1635770967317.jpg",
                    "link": "https://docs.google.com/forms/d/e/1FAIpQLSfoJsQluAhomWeV4mEKi8RS1kKCEYiGhdILMT7CCkLPh399pA/viewform",
                    "available_for": "Employee",
                    "added_date": "1635770967",
                    "updated_date": "1645083860",
                    "status": "1",
                    "form_type": "form",
                    "signature_required": "no",
                    "submitted": false,
                    "detail": {
                    "type": "form",
                    "slug": "employee-information-form-1"
                    }
                },
                {
                    "id": "7",
                    "name": "Bank Information Form",
                    "slug_name": "bank-information-form",
                    "image": "1635141624396.jpg",
                    "link": "https://docs.google.com/forms/d/e/1FAIpQLSfDVZs2S-8hVPFqrpy8wAfZcGNnO9iOwKdjTGT4403gQ7Neeg/viewform?pli=1",
                    "available_for": "Employee",
                    "added_date": "1635239389",
                    "updated_date": "1771245286",
                    "status": "1",
                    "form_type": "form",
                    "signature_required": "no",
                    "submitted": false,
                    "detail": {
                    "type": "form",
                    "slug": "bank-information-form"
                    }
                },
                {
                    "id": "12",
                    "name": "Shipment Details Form",
                    "slug_name": "shipment-details-form",
                    "image": "1635141904761.jpg",
                    "link": "https://docs.google.com/forms/d/e/1FAIpQLScoaMmwTA-2uNOLxr4hzqe5VzlAFbL3_5xpB8axgwf-aMyB5A/viewform",
                    "available_for": "All",
                    "added_date": "1634040086",
                    "updated_date": "1675248602",
                    "status": "1",
                    "form_type": "form",
                    "signature_required": "no",
                    "submitted": false,
                    "detail": {
                    "type": "form",
                    "slug": "shipment-details-form"
                    }
                },
                {
                    "id": "9",
                    "name": "PF Declaration Form",
                    "slug_name": "pf-declaration-form",
                    "image": "1635141726463.jpg",
                    "link": "https://docs.google.com/forms/d/e/1FAIpQLSfmZ-c7bxV6SeaSvY8E5WKVbEu9VPYXpVHU_Wj3jBznQszHjw/viewform",
                    "available_for": "Employee",
                    "added_date": "1634040085",
                    "updated_date": "1645083536",
                    "status": "1",
                    "form_type": "form",
                    "signature_required": "no",
                    "submitted": false,
                    "detail": {
                    "type": "form",
                    "slug": "pf-declaration-form"
                    }
                },
                {
                    "id": "10",
                    "name": "KYC Form for PF & ESIC",
                    "slug_name": "kyc-form-for-pf-esic",
                    "image": "1635141809359.jpg",
                    "link": "https://docs.google.com/forms/d/e/1FAIpQLSeAniL8DnTaoH9b1-PLGLj7jwyxdM3v96UYvHWXa9DZk31Qbw/viewform?embedded=true",
                    "available_for": "Employee",
                    "added_date": "1634040066",
                    "updated_date": "1735037771",
                    "status": "1",
                    "form_type": "form",
                    "signature_required": "no",
                    "submitted": false,
                    "detail": {
                    "type": "form",
                    "slug": "kyc-form-for-pf-esic"
                    }
                },
                {
                    "id": "11",
                    "name": "Bank Account Information for PF & ESIC",
                    "slug_name": "bank-account-information-for-pf-esic",
                    "image": "1635141865204.jpg",
                    "link": "https://docs.google.com/forms/d/e/1FAIpQLSfSgwiiufZCSayxc31U59aSzsL_C5MzF86Zx9S6Xn-dlf3JzA/viewform",
                    "available_for": "Employee",
                    "added_date": "1634040003",
                    "updated_date": "1645083571",
                    "status": "1",
                    "form_type": "form",
                    "signature_required": "no",
                    "submitted": false,
                    "detail": {
                    "type": "form",
                    "slug": "bank-account-information-for-pf-esic"
                    }
                }
                ]
            }
            }


9. Google Form Is not scrollable i am not able to scroll please fix this 

10. Please Use instead of App_Logo.svg to app-icon.png

11. Need to ReDesign the Login Page & Splash screen:
##  Splash Screen:
    Show only bubble animate logo app-icon.png 
##  Login Screen:
    Need to see first the refernce Login Reference.png 
    Existing Background existing Logo remove bitpastel image  Employee zone text Make the card design like this, Auto complete suggestion needed, No SSH Login  -->




Tech Requirements:

Expo SDK latest
TypeScript
React Native Reanimated v3
react-native-gesture-handler
react-native-reanimated-carousel
expo-linear-gradient
expo-blur
expo-image

Component name:
FeaturedHeroCarousel.tsx

Design Requirements:

Layout:

Full-width horizontal carousel
Card width: 88% screen width
Height: 520
Center focused card
Adjacent cards partially visible
Infinite loop
Smooth snap animation
Autoplay every 4 seconds

Card Style:

Border radius: 32
Dark cinematic overlay
Poster image background
Bottom gradient overlay
Scale active card to 1
Scale inactive cards to 0.92
Slight horizontal parallax
Shadow + glow effect

Top Badge:

Floating badge
Semi-transparent black
Icon + label
Example:
"🎉 New Release"

Content:

Large movie title
Metadata row:
Year • Language • Genre • Category

Example:
2026 • Hindi • Drama • Family

Right Floating Actions:

Circular Add button
Circular Play button
Glassmorphism effect
Elevated shadow

Buttons:
Add:

size 64
blurred dark background

Play:

size 72
white background
black play icon

Animation:

Fade + Scale transition
Parallax movement
Smooth spring animation

Bottom:

Pagination dots
Active dot expands

# ✅ Final Mandatory Validation Requirement

 **All Mobile App workflows must have fully working frontend validations.  
No feature is considered complete unless validation is correctly enforced at both layers and all flows operate without errors.**

