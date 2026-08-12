\# ONIRIA Investments — Entity Relationship Diagram



Maintained by Kelvin — Database Lead



```mermaid

erDiagram

&#x20; PROFILES ||--o{ STAFF\_ROLES : has

&#x20; PROFILES ||--o{ NEWS\_ARTICLES : authors

&#x20; PROFILES ||--o{ LEADS : assigned\_to

&#x20; PROFILES ||--o{ LEAD\_NOTES : writes

&#x20; PROJECTS ||--o{ PROJECT\_MEDIA : has

&#x20; PROJECTS ||--o{ LEADS : referenced\_by

&#x20; NEWS\_ARTICLES ||--o{ NEWS\_ARTICLE\_CATEGORIES : has

&#x20; NEWS\_CATEGORIES ||--o{ NEWS\_ARTICLE\_CATEGORIES : has

&#x20; LEADS ||--o{ LEAD\_NOTES : has



&#x20; PROFILES {

&#x20;   uuid id PK

&#x20;   string full\_name

&#x20;   string email

&#x20;   enum status

&#x20; }

&#x20; STAFF\_ROLES {

&#x20;   uuid id PK

&#x20;   uuid user\_id FK

&#x20;   enum role

&#x20; }

&#x20; PROJECTS {

&#x20;   uuid id PK

&#x20;   string slug

&#x20;   string name

&#x20;   enum status

&#x20; }

&#x20; PROJECT\_MEDIA {

&#x20;   uuid id PK

&#x20;   uuid project\_id FK

&#x20;   string url

&#x20; }

&#x20; BUSINESS\_AREAS {

&#x20;   uuid id PK

&#x20;   string slug

&#x20;   string name

&#x20; }

&#x20; NEWS\_ARTICLES {

&#x20;   uuid id PK

&#x20;   string slug

&#x20;   string title

&#x20;   enum status

&#x20;   uuid author\_id FK

&#x20; }

&#x20; NEWS\_CATEGORIES {

&#x20;   uuid id PK

&#x20;   string slug

&#x20;   string name

&#x20; }

&#x20; NEWS\_ARTICLE\_CATEGORIES {

&#x20;   uuid article\_id FK

&#x20;   uuid category\_id FK

&#x20; }

&#x20; LEADS {

&#x20;   uuid id PK

&#x20;   string reference\_no

&#x20;   uuid project\_id FK

&#x20;   uuid assigned\_to FK

&#x20;   enum status

&#x20; }

&#x20; LEAD\_NOTES {

&#x20;   uuid id PK

&#x20;   uuid lead\_id FK

&#x20;   uuid staff\_id FK

&#x20; }

&#x20; SITE\_SETTINGS {

&#x20;   string key PK

&#x20;   jsonb value\_json

&#x20; }

&#x20; AUDIT\_LOG {

&#x20;   uuid id PK

&#x20;   uuid actor\_id FK

&#x20;   string action

&#x20; }

```



Note: `business\_areas` and `site\_settings` have no foreign key relationships

to other tables — they are standalone content/config tables.



Renders automatically on GitHub (GitHub supports Mermaid diagrams natively

in `.md` files).

