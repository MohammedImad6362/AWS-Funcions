const AWS = require("aws-sdk");

// Set your AWS region, Cognito User Pool ID, and DynamoDB table name
AWS.config.update({ region: "ap-south-1" });
const userPoolId = "ap-south-1_1M7FLYgyw";

// Initialize the Cognito Identity Provider client and DynamoDB Document Client
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

// List of usernames to delete
const usernamesToDelete =   [
  "BE/1425/2022-23",
  "BE/0006474",
  "BE/1370/2019-20",
  "BE/1373/2019-20",
  "BE/651/2021-22",
  "BE/237/2022-23",
  "BE/00013218",
  "BE/1051/2019-20",
  "BE/493/2023-24",
  "BE/1558/2022-23",
  "BE/1682/2022-23",
  "BE/0007813",
  "BE/387/2022-23",
  "BE/0007735",
  "BE/236/2022-23",
  "BE/278/2021-22",
  "BE/00010249",
  "BE/0009020",
  "BE/973/2022-23",
  "BE/662/2021-22",
  "BE/1255/2019-20",
  "BE/972/2020-21",
  "BE/0755/2019-20",
  "BE/0633/2019-20",
  "BE/660/2022-23",
  "BE/00010409",
  "BE/00011490",
  "BE/784/2021-22",
  "BE/00012832",
  "BE/00013768",
  "BE/0008620",
  "BE/0006676",
  "BE/0007470",
  "BE/0006691",
  "BE/00013740",
  "BE/456/2023-24",
  "BE/0007858",
  "BE/0006912",
  "BE/0006208",
  "BE/0009075",
  "BE/0009225",
  "BE/1464/2022-23",
  "BE/492/2022-23",
  "BE/1050/2020-21",
  "BE/494/2020-21",
  "BE/1345/2023-24",
  "BE/620/2021-22",
  "BE/0007506",
  "BE/00010236",
  "BE/0009452",
  "BE/1285/2023-24",
  "BE/0007458",
  "BE/0007073",
  "BE/00010322",
  "BE/00011531",
  "BE/00012185",
  "BE/973/2020-21",
  "BE/576/2022-23",
  "BE/661/2020-21",
  "BE/1361/2023-24",
  "BE/1027/2020-21",
  "BE/0915/2019-20",
  "BE/0009788",
  "BE/1017/2023-24",
  "BE/0007629",
  "BE/0006972",
  "BE/00013165",
  "BE/1117/2023-24",
  "BE/972/2022-23",
  "BE/1768/2022-23",
  "BE/0007946",
  "BE/0006454",
  "BE/1314/2022-23",
  "BE/457/2020-21",
  "BE/1443/2019-20",
  "BE/0006403",
  "BE/971/2020-21",
  "BE/0591/2019-20",
  "BE/0008889",
  "BE/00012035",
  "BE/00010334",
  "BE/00013178",
  "BE/0006314",
  "BE/276/2023-24",
  "BE/0007607",
  "BE/386/2023-24",
  "BE/0166/2019-20",
  "BE/00013442",
  "BE/984/2021-22",
  "BE/483/2022-23",
  "BE/0006522",
  "BE/0006227",
  "BE/0006455",
  "BE/920/2022-23",
  "BE/144/2021-22",
  "BE/1153/2023-24",
  "BE/1779/2022-23",
  "BE/00010823",
  "BE/0006192",
  "BE/1088/2020-21",
  "BE/1648/2022-23",
  "BE/1252/2022-23",
  "BE/00010367",
  "BE/00013595",
  "BE/00011417",
  "BE/0006380",
  "BE/605/2020-21",
  "BE/0008102",
  "BE/0007633",
  "BE/251/2022-23",
  "BE/0006404",
  "BE/451/2023-24",
  "BE/0606/2019-20",
  "BE/1257/2022-23",
  "BE/623/2022-23",
  "BE/0006186",
  "BE/0421/2019-20",
  "BE/00011424",
  "BE/609/2023-24",
  "BE/00011426",
  "BE/0008938",
  "BE/00010255",
  "BE/00013161",
  "BE/1354/2022-23",
  "BE/1887/2022-23",
  "BE/00013042",
  "BE/1504/2022-23",
  "BE/0006290",
  "BE/1100/2020-21",
  "BE/514/2023-24",
  "BE/0007351",
  "BE/355/2021-22",
  "BE/0007618",
  "BE/681/2023-24",
  "BE/00013149",
  "BE/1406/2019-20",
  "BE/921/2023-24",
  "BE/00011878",
  "BE/0006399",
  "BE/00010053",
  "BE/0623/2019-20",
  "BE/660/2020-21",
  "BE/443/2022-23",
  "BE/1653/2022-23",
  "BE/1818/2022-23",
  "BE/1633/2022-23",
  "BE/817/2023-24",
  "BE/1297/2022-23",
  "BE/512/2021-22",
  "BE/0007691",
  "BE/1368/2022-23",
  "BE/00010737",
  "BE/750/2022-23",
  "BE/00011474",
  "BE/0006485",
  "BE/0008526",
  "BE/870/2023-24",
  "BE/1168/2023-24",
  "BE/0006140",
  "BE/00010237",
  "BE/00011341",
  "BE/0006794",
  "BE/570/2020-21",
  "BE/004/2021-22",
  "BE/00011427",
  "BE/00010230",
  "BE/00010222",
  "BE/1004/2021-22",
  "BE/0008127",
  "BE/350/2023-24",
  "BE/0006228",
  "BE/00010544",
  "BE/00010778",
  "BE/1738/2022-23",
  "BE/1282/2021-22",
  "BE/00010264",
  "BE/0555/2019-20",
  "BE/760/2020-21",
  "BE/0006265",
  "BE/1513/2022-23",
  "BE/1095/2023-24",
  "BE/0009104",
  "BE/0006475",
  "BE/539/2020-21",
  "BE/019/2020-21",
  "BE/0006333",
  "BE/00012119",
  "BE/0006147",
  "BE/00013419",
  "BE/057/2021-22",
  "BE/1622/2022-23",
  "BE/0006138",
  "BE/1133/2023-24",
  "BE/542/2023-24",
  "BE/00011989",
  "BE/1466/2019-20",
  "BE/174/2020-21",
  "BE/00010138",
  "BE/1037/2022-23",
  "BE/0006196",
  "BE/0006414",
  "BE/0007659",
  "BE/00011163",
  "BE/970/2022-23",
  "BE/00012919",
  "BE/1238/2023-24",
  "BE/0006164",
  "BE/464/2022-23",
  "BE/00010089",
  "BE/00011926",
  "BE/850/2023-24",
  "BE/00010142",
  "BE/588/2020-21",
  "BE/1283/2019-20",
  "BE/0006413",
  "BE/0007636",
  "BE/072/2020-21",
  "BE/0008362",
  "BE/00012417",
  "BE/803/2023-24",
  "BE/0006176",
  "BE/0006441",
  "BE/00010397",
  "BE/1707/2022-23",
  "BE/0007426",
  "BE/00010137",
  "BE/843/2023-24",
  "BE/0007673",
  "BE/215/2021-22",
  "BE/0006489",
  "BE/842/2023-24",
  "BE/498/2021-22",
  "BE/0008921",
  "BE/0006384",
  "BE/0006388",
  "BE/00013782",
  "BE/0006991",
  "BE/00010075",
  "BE/1660/2022-23",
  "BE/00012678",
  "BE/0009057",
  "BE/1829/2022-23",
  "BE/551/2020-21",
  "BE/00010192",
  "BE/00010992",
  "BE/250/2020-21",
  "BE/0006461",
  "BE/1644/2022-23",
  "BE/580/2021-22",
  "BE/1052/2020-21",
  "BE/00010831",
  "BE/00010248",
  "BE/00010844",
  "BE/1211/2023-24",
  "BE/00010190",
  "BE/0006205",
  "BE/445/2023-24",
  "BE/171/2022-23",
  "BE/636/2022-23",
  "BE/0006640",
  "BE/390/2021-22",
  "BE/0640/2019-20",
  "BE/0006592",
  "BE/00010198",
  "BE/490/2020-21",
  "BE/447/2020-21",
  "BE/00012822",
  "BE/1303/2022-23",
  "BE/1148/2020-21",
  "BE/506/2020-21",
  "BE/0007788",
  "BE/1272/2022-23",
  "BE/704/2023-24",
  "BE/0006318",
  "BE/871/2022-23",
  "BE/0007545",
  "BE/041/2021-22",
  "BE/265/2020-21",
  "BE/472/2023-24",
  "BE/0008954",
  "BE/826/2023-24",
  "BE/908/2023-24",
  "BE/0006231",
  "BE/563/2021-22",
  "BE/327/2020-21",
  "BE/00012669",
  "BE/1212/2023-24",
  "BE/964/2023-24",
  "BE/00012636",
  "BE/443/2023-24",
  "BE/220/2022-23",
  "BE/439/2022-23",
  "BE/329/2020-21",
  "BE/0618/2019-20",
  "BE/0009420",
  "BE/998/2023-24",
  "BE/0008884",
  "BE/00010763",
  "BE/0009081",
  "BE/657/2022-23",
  "BE/00011667",
  "BE/0008915",
  "BE/1279/2023-24",
  "BE/1097/2021-22",
  "BE/701/2021-22",
  "BE/634/2020-21",
  "BE/00013158",
  "BE/295/2020-21",
  "BE/00010874",
  "BE/048/2021-22",
  "BE/0091/2019-20",
  "BE/701/2023-24",
  "BE/0296/2019-20",
  "BE/764/2023-24",
  "BE/995/2020-21",
  "BE/384/2023-24",
  "BE/1290/2023-24",
  "BE/1517/2022-23",
  "BE/00011719",
  "BE/210/2020-21",
  "BE/0007781",
  "BE/0007453",
  "BE/845/2023-24",
  "BE/0007478",
  "BE/0687/2019-20",
  "BE/0007709",
  "BE/00013096",
  "BE/296/2023-24",
  "BE/0008289",
  "BE/591/2021-22",
  "BE/0009072",
  "BE/348/2023-24",
  "BE/00013180",
  "BE/0007314",
  "BE/0641/2019-20",
  "BE/0006303",
  "BE/845/2021-22",
  "BE/286/2023-24",
  "BE/00012721",
  "BE/0006325",
  "BE/0009812",
  "BE/1262/2019-20",
  "BE/0009438",
  "BE/809/2023-24",
  "BE/0006142",
  "BE/00012013",
  "BE/00010207",
  "BE/293/2023-24",
  "BE/00010065",
  "BE/0006438",
  "BE/740/2023-24",
  "BE/299/2021-22",
  "BE/0007260",
  "BE/00010541",
  "BE/288/2023-24",
  "BE/246/2023-24",
  "BE/00011023",
  "BE/876/2023-24",
  "BE/206/2020-21",
  "BE/0006252",
  "BE/00013032",
  "BE/0007553",
  "BE/203/2023-24",
  "BE/0006393",
  "BE/147/2020-21",
  "BE/0008245",
  "BE/291/2023-24",
  "BE/00010184",
  "BE/238/2020-21",
  "BE/0007714",
  "BE/630/2022-23",
  "BE/00010106",
  "BE/1170/2019-20",
  "BE/0006326",
  "BE/1656/2022-23",
  "BE/00013153",
  "BE/0006511",
  "BE/846/2023-24",
  "BE/0007940",
  "BE/0009236",
  "BE/0006201",
  "BE/0419/2019-20",
  "BE/473/2023-24",
  "BE/113/2020-21",
  "BE/0007687",
  "BE/560/2023-24",
  "BE/00012026",
  "BE/953/2022-23",
  "BE/974/2021-22",
  "BE/1234/2022-23",
  "BE/1299/2023-24",
  "BE/0007727",
  "BE/1185/2019-20",
  "BE/831/2021-22",
  "BE/0007555",
  "BE/919/2023-24",
  "BE/0006224",
  "BE/0009405",
  "BE/231/2023-24",
  "BE/00010553",
  "BE/0006536",
  "BE/909/2023-24",
  "BE/0007556",
  "BE/0007569",
  "BE/0006366",
  "BE/558/2021-22",
  "BE/00010263",
  "BE/00011974",
  "BE/0006510",
  "BE/930/2021-22",
  "BE/647/2023-24",
  "BE/578/2023-24",
  "BE/0006356",
  "BE/0006272",
  "BE/0006420",
  "BE/1150/2021-22",
  "BE/457/2023-24",
  "BE/1774/2022-23",
  "BE/1339/2023-24",
  "BE/887/2022-23",
  "BE/00012763",
  "BE/200/2022-23",
  "BE/377/2020-21",
  "BE/1405/2019-20",
  "BE/420/2022-23",
  "BE/00010730",
  "BE/00010830",
  "BE/00012837",
  "BE/1604/2022-23",
  "BE/911/2023-24",
  "BE/594/2023-24",
  "BE/918/2023-24",
  "BE/1740/2022-23",
  "BE/0006177",
  "BE/140/2020-21",
  "BE/1610/2022-23",
  "BE/0006330",
  "BE/00013481",
  "BE/733/2021-22",
  "BE/0007904",
  "BE/0006199",
  "BE/361/2023-24",
  "BE/00013538",
  "BE/00013474",
  "BE/0009820",
  "BE/00012197",
  "BE/239/2023-24",
  "BE/00013757",
  "BE/943/2023-24",
  "BE/0007602",
  "BE/1073/2020-21",
  "BE/1037/2020-21",
  "BE/1903/2022-23",
  "BE/0008387",
  "BE/1828/2022-23",
  "BE/0006289",
  "BE/000/10708",
  "BE/424/2020-21",
  "BE/009/2020-21",
  "BE/536/2021-22",
  "BE/266/2022-23",
  "BE/0006293",
  "BE/691/2022-23",
  "BE/00013237",
  "BE/1307/2022-23",
  "BE/0006298",
  "BE/176/2022-23",
  "BE/0006637",
  "BE/925/2020-21",
  "BE/0006382",
  "BE/00012036",
  "BE/900/2021-22",
  "BE/824/2023-24",
  "BE/0007712",
  "BE/289/2020-21",
  "BE/1073/2022-23",
  "BE/00010957",
  "BE/0006281",
  "BE/1899/2022-23",
  "BE/068/2021-22",
  "BE/0008041",
  "BE/0009012",
  "BE/0006264",
  "BE/0007495",
  "BE/464/2021-22",
  "BE/169/2022-23",
  "BE/0006408",
  "BE/0375/2019-20",
  "BE/0006487",
  "BE/00010431",
  "BE/0009102",
  "BE/842/2020-21",
  "BE/683/2022-23",
  "BE/357/2020-21",
  "BE/848/2022-23",
  "BE/0007993",
  "BE/0006364",
  "BE/00011837",
  "BE/1131/2023-24",
  "BE/0006162",
  "BE/00010859",
  "BE/0007732",
  "BE/0007733",
  "BE/0007493",
  "BE/0020/2019-20",
  "BE/00010661",
  "BE/0006509",
  "BE/0008428",
  "BE/0180/2019-20",
  "BE/0007454",
  "BE/00010430",
  "BE/1105/2023-24",
  "BE/0551/2019-20",
  "BE/00012817",
  "BE/00012404",
  "BE/1162/2021-22",
  "BE/1066/2019-20",
  "BE/1509/2022-23",
  "BE/1359/2022-23",
  "BE/1234/2019-20",
  "BE/00010129",
  "BE/00011881",
  "BE/00013535",
  "BE/1001/2019-20",
  "BE/0007156",
  "BE/0006995",
  "BE/967/2023-24",
  "BE/0006279",
  "BE/00010260",
  "BE/00010261",
  "BE/1747/2022-23",
  "BE/0009899",
  "BE/0006653",
  "BE/0009857",
  "BE/0007446",
  "BE/919/2022-23",
  "BE/1765/2022-23",
  "BE/00012263",
  "BE/0006155",
  "BE/00010242",
  "BE/00013220",
  "BE/00012892",
  "BE/976/2022-23",
  "BE/0006367",
  "BE/977/2023-24",
  "BE/0006278",
  "BE/0006324",
  "BE/1136/2023-24",
  "BE/1484/2022-23",
  "BE/00010252",
  "BE/00013748",
  "BE/0006268",
  "BE/0009311",
  "BE/0007736",
  "BE/933/2021-22",
  "BE/00010090",
  "BE/00011382",
  "BE/242/2023-24",
  "BE/484/2020-21",
  "BE/00011480",
  "BE/1188/2022-23",
  "BE/526/2020-21",
  "BE/724/2021-22",
  "BE/0006225",
  "BE/0006232",
  "BE/1748/2022-23",
  "BE/0006498",
  "BE/1218/2019-20",
  "BE/0006229",
  "BE/1135/2023-24",
  "BE/1637/2022-23",
  "BE/0007358",
  "BE/218/2022-23",
  "BE/0610/2019-20",
  "BE/0009705",
  "BE/1749/2022-23",
  "BE/0007886",
  "BE/685/2022-23",
  "BE/1163/2023-24",
  "BE/051/2020-21",
  "BE/0008997",
  "BE/0006329",
  "BE/1219/2019-20",
  "BE/616/2020-21",
  "BE/910/2023-24",
  "BE/00012740",
  "BE/185/2020-21",
  "BE/00010492",
  "BE/654/2022-23",
  "BE/00012145",
  "BE/708/2021-22",
  "BE/0009300",
  "BE/582/2020-21",
  "BE/0007829",
  "BE/1419/2019-20",
  "BE/0006143",
  "BE/416/2020-21",
  "BE/0009801",
  "BE/0009312",
  "BE/00013719",
  "BE/1368/2021-22",
  "BE/00013563",
  "BE/0006249",
  "BE/0006149",
  "BE/0006666",
  "BE/039/2020-21",
  "BE/0009228",
  "BE/552/2020-21",
  "BE/00012710",
  "BE/0173/2019-20",
  "BE/0007912",
  "BE/0006151",
  "BE/0006467",
  "BE/209/2020-21",
  "BE/690/2021-22",
  "BE/0006450",
  "BE/00012385",
  "BE/0327/2019-20",
  "BE/450/2022-23",
  "BE/1746/2022-23",
  "BE/00011852",
  "BE/00013718",
  "BE/971/2022-23",
  "BE/0006466",
  "BE/0008987",
  "BE/0008963",
  "BE/0008473",
  "BE/0009453",
  "BE/633/2022-23",
  "BE/0006299",
  "BE/00012798",
  "BE/1876/2022-23",
  "BE/238/2023-24",
  "BE/00013536",
  "BE/0006216",
  "BE/240/2023-24",
  "BE/1253/2021-22",
  "BE/923/2020-21",
  "BE/340/2020-21",
  "BE/179/2022-23",
  "BE/0833/2019-20",
  "BE/0185/2019-20",
  "BE/1233/2022-23",
  "BE/0007613",
  "BE/0006159",
  "BE/0006260",
  "BE/0007933",
  "BE/743/2023-24",
  "BE/0006184",
  "BE/987/2022-23",
  "BE/0007456",
  "BE/0006277",
  "BE/574/2023-24",
  "BE/0006292",
  "BE/0009722",
  "BE/474/2021-22",
  "BE/00010168",
  "BE/0006182",
  "BE/00010167",
  "BE/0007422",
  "BE/0009709",
  "BE/0007452",
  "BE/1292/2023-24",
  "BE/446/2020-21",
  "BE/00010310",
  "BE/0008920",
  "BE/579/2021-22",
  "BE/0006392",
  "BE/012/2020-21",
  "BE/0006135",
  "BE/1139/2023-24",
  "BE/0006203",
  "BE/0006218",
  "BE/00010145",
  "BE/0009673",
  "BE/0007603",
  "BE/0008916",
  "BE/0006583",
  "BE/0006587",
  "BE/0295/2019-20",
  "BE/00010238",
  "BE/0006312",
  "BE/0006183",
  "BE/0006336",
  "BE/1344/2022-23",
  "BE/00010460",
  "BE/0006191",
  "BE/1343/2022-23",
  "BE/393/2021-22",
  "BE/00011007",
  "BE/322/2020-21",
  "BE/00010235",
  "BE/0006335",
  "BE/0006334",
  "BE/1275/2023-24",
  "BE/0006188",
  "BE/0006223",
  "BE/745/2023-24",
  "BE/0661/2019-20",
  "BE/1160/2023-24",
  "BE/0006346",
  "BE/941/2021-22",
  "BE/00010072",
  "BE/988/2021-22",
  "BE/1270/2023-24",
  "BE/1043/2023-24",
  "BE/380/2021-22",
  "BE/0006359",
  "BE/1466/2022-23",
  "BE/0008868",
  "BE/00011570",
  "BE/294/2022-23",
  "BE/142/2021-22",
  "BE/00010227",
  "BE/0006198",
  "BE/0006212",
  "BE/0006361",
  "BE/717/2023-24",
  "BE/0007461",
  "BE/1287/2022-23",
  "BE/822/2023-24",
  "BE/706/2023-24",
  "BE/522/2023-24",
  "BE/00011471",
  "BE/1323/2023-24",
  "BE/00010183",
  "BE/1317/2023-24",
  "BE/566/2023-24",
  "BE/00010652",
  "BE/1114/2020-21",
  "BE/00010400",
  "BE/0006233",
  "BE/645/2023-24",
  "BE/0006350",
  "BE/00011053",
  "BE/0006953",
  "BE/0006795",
  "BE/0006375",
  "BE/1175/2021-22",
  "BE/924/2021-22",
  "BE/0006148",
  "BE/1246/2022-23",
  "BE/0007814",
  "BE/00013169",
  "BE/0006197",
  "BE/0006181",
  "BE/1053/2021-22",
  "BE/228/2020-21",
  "BE/0006270",
  "BE/610/2022-23",
  "BE/1238/2020-21",
  "BE/0006585",
  "BE/0006370",
  "BE/0008960",
  "BE/0007677",
  "BE/00010485",
  "BE/0007464",
  "BE/775/2021-22",
  "BE/705/2023-24",
  "BE/797/2023-24",
  "BE/00010173",
  "BE/0005924",
  "BE/1345/2022-23",
  "BE/929/2023-24",
  "BE/00013417",
  "BE/236/2023-24",
  "BE/868/2023-24",
  "BE/00011879",
  "BE/0007465",
  "BE/0006482",
  "BE/159/2020-21",
  "BE/960/2020-21",
  "BE/522/2021-22",
  "BE/346/2020-21",
  "BE/0008051",
  "BE/00013747",
  "BE/0006478",
  "BE/197/2023-24",
  "BE/00013659",
  "BE/0007616",
  "BE/0007631",
  "BE/0007352",
  "BE/286/2021-22",
  "BE/575/2023-24",
  "BE/00010413",
  "BE/1733/2022-23",
  "BE/0006622",
  "BE/0006508",
  "BE/0009246",
  "BE/0006944",
  "BE/0008378",
  "BE/0006360",
  "BE/582/2023-24",
  "BE/0007237",
  "BE/0006194",
  "BE/1281/2023-24",
  "BE/00011468",
  "BE/00010422",
  "BE/00011416",
  "BE/0007163",
  "BE/802/2020-21",
  "BE/0006924",
  "BE/0006213",
  "BE/0006273",
  "BE/00012800",
  "BE/1209/2023-24",
  "BE/355/2022-23",
  "BE/1501/2022-23",
  "BE/1230/2019-20",
  "BE/0007655",
  "BE/0007193",
  "BE/0007605",
  "BE/00010671",
  "BE/1767/2022-23",
  "BE/1266/2023-24",
  "BE/1853/2022-23",
  "BE/0006519",
  "BE/00013416"
];



let notFound = 0;
let deleted = 0;
async function deleteUser(username) {
  try {
    // Delete user from Cognito User Pool
    await cognitoIdentityServiceProvider
      .adminDeleteUser({
        UserPoolId: userPoolId,
        Username: username,
      })
      .promise();

    console.log(`User ${username} deleted from Cognito User Pool successfully.`);
    deleted++;
  } catch (error) {
    if (error.code === "UserNotFoundException") {
      console.log(`User ${username} not found.`);
      notFound++;
    } else {
      console.error(`Error deleting user ${username}: ${error.message}`);
    }
  }
}

async function deleteUsers() {
  // await Promise.all(usernamesToDelete.map(async (username) => {
    for(const username of usernamesToDelete){
    await deleteUser(username);
    await new Promise(resolve => setTimeout(resolve, 50));
  // }));
    }
  console.log(`Total: ${usernamesToDelete.length}\t Deleted: ${deleted} \t Not Found: ${notFound}`);
}


deleteUsers();
