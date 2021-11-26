const getProtocol = (req, res, next) => {

  //If no protocol is found or the protocol is empty we return error
  if (!req.body.protocols || req.body.protocols.length === 0) {
    res.status(400).json("There must be at least one valid protocol")
  }

  //We check that none of the protocols we have received is not allowed.
  const disallowedProtocol = getIncorretProtocols(req.body.protocols)

  if(disallowedProtocol === true){
    res.status(400).json("There are incorrect protocols, check them")
  }

  //We see if there are no protocols that conflict with each other.
  const conflict = getConflictions(req.body.protocols)
  if (conflict === true) {
    res.status(400).json("You cannot include protocols that conflict with each other.")
  }

  //We see how many valid attacks we have (valid means no more than 100 metres away).
  const validProtocols = skipLonger(req.body.scan)
  
  const correctProtocols = {...req.body, scan: validProtocols}

  //If there is only one protocol, we focus on that protocol.
  if (correctProtocols.protocols.length === 1) {
    console.log("1")
    correctProtocols.protocols[0] === "closest-enemies"
    ? 
    res.status(200).json(closestEnemies(correctProtocols))
    : correctProtocols.protocols[0] === "furthest-enemies"
    ? res.status(200).json(furthestEnemies(correctProtocols))
    : correctProtocols.protocols[0] === "assist-allies"
    ? res.status(200).json(closestEnemies(assistAllies(correctProtocols)))
    : correctProtocols.protocols[0] === "avoid-crossfire"
    ? (!avoidCrossfire(correctProtocols) ? res.status(400).json("There is no coords without allies") : res.status(200).json(closestEnemies(avoidCrossfire(correctProtocols)))) 
    : correctProtocols.protocols[0] === "prioritize-mech"
    ? res.status(200).json(closestEnemies(prioritizeMech(correctProtocols)))
    : correctProtocols.protocols[0] === "avoid-mech"
    ? (!avoidMech(correctProtocols) ? res.status(400).json("There is no coords without mechs") : res.status(200).json(closestEnemies(avoidMech(correctProtocols)))) 
    : null
  }

  if(correctProtocols.protocols.length > 1){
    let attack
    let attack2 
    let attack3  

    if(correctProtocols.protocols.includes("assist-allies")){
      attack = assistAllies(correctProtocols)
    }
    if(correctProtocols.protocols.includes("avoid-crossfire")){
      !attack ? attack = avoidCrossfire(correctProtocols) : attack2 = avoidCrossfire(attack) 
    }
    if(correctProtocols.protocols.includes("prioritize-mech")){
      !attack ? attack = prioritizeMech(correctProtocols) : attack2 = prioritizeMech(attack) 
    }
    if(correctProtocols.protocols.includes("avoid-mech")){
      !attack ? attack = avoidMech(correctProtocols) : attack2 = avoidMech(attack) 
    }
    if(correctProtocols.protocols.includes("furthest-enemies")){
      !attack2 ? attack2 = furthestEnemies(attack) : attack3 = furthestEnemies(attack2) 
    }else{
      !attack2 ? attack2 = closestEnemies(attack) : attack3 = closestEnemies(attack2) 
    }
    !attack3 ? res.status(200).json(attack2) : res.status(200).json(attack3) 
  }
}

//Assuming there are no enemy-free coordinates
const closestEnemies = (attack) => {
  let longest = 100
  let cordAttack = {}
  attack.scan.map(x => {
    const num = calculateDistance(x.coordinates)
    if (num < longest){
      longest = num
      cordAttack = x.coordinates
      return cordAttack
    }
  })
  return cordAttack
}

//Assuming there are no enemy-free coordinates
const furthestEnemies = (attack) => {
  let longest = 0
  let cordAttack = {} 
  attack.scan.map(x => {
    const num = calculateDistance(x.coordinates)
    if (num > longest){
      longest = num
      cordAttack = x.coordinates
    }
    return cordAttack
  })
  return cordAttack
}


const assistAllies = (attack) => {
  validCood = []
  attack.scan.filter(x => {
    if(x.allies !== undefined){
      validCood.push(x)
    }
  })
  //In case no coordinates are returned because no ally is found in the sent attacks, we will return all attacks without filtering.
  if(validCood.length === 0){
    return attack
  }
  validAttack = {...attack, scan: validCood}
  return validAttack
}

const avoidCrossfire = (attack) => {
  validCood = []
  attack.scan.filter(x => {
    if(x.allies === undefined){
      validCood.push(x)
    }
  })
  //In case it does not return any coordinates since all of them have allies in the sent attacks, we will return all attacks without filtering.
  if(validCood.length === 0){
    return false
  }
  validAttack = {...attack, scan: validCood}
  return validAttack
} 

const prioritizeMech = (attack) => {
  validCood = []
  attack.scan.filter(x => {
    if(x.enemies.type === "mech"){
      validCood.push(x)
    }
  })
  //In case it does not return any coordinates as none of them have mech in the sent attacks, we will return all attacks without filtering.
  if(validCood.length === 0){
    return attack
  }
  validAttack = {...attack, scan: validCood}
  return validAttack
}

const avoidMech = (attack) => {
  validCood = []
  attack.scan.filter(x => {
    if(x.enemies.type !== "mech"){
      validCood.push(x)
    }
  })
  //In case it does not return any coordinates as all of them have mech in the sent attacks, we will return all attacks without filtering.
  if(validCood.length === 0){
    return false
  }
  validAttack = {...attack, scan: validCood}
  return validAttack
}

//We will exclude all attacks that are more than 100 metres away.
const skipLonger = (scan) => {
  validCood = []
  scan.map((x) => {
    num = calculateDistance(x.coordinates)
    if (num <= 100){
      validCood.push(scan.filter(y => y.coordinates === x.coordinates)[0])
    }else{
      null
    }
  })
  return validCood
}

//Calculating the distance between two points on a Cartesian axis
const calculateDistance = (end) => {
  const start = { x: 0, y: 0 }
  const distance = Math.sqrt((Math.pow((end.x - start.x), 2)) + (Math.pow((end.y - start.y), 2))) 
  return distance
}

//See if there are conflicting protocols
const getConflictions = (protocols) => {
  if (protocols.includes("avoid-mech") && protocols.includes("prioritize-mech")) return true
  if (protocols.includes("closest-enemies") && protocols.includes("furthers-enemies")) return true
  if (protocols.includes("assist-allies") && protocols.includes("avoid-crossfire")) return true
  return false
}

//See if there are protocols that are not defined.
const getIncorretProtocols = (protocols) => {
  const prot = ["closest-enemies", "furthest-enemies", "assist-allies", "avoid-crossfire", "prioritize-mech", "avoid-mech"]
  
  const valid = protocols.map((x) => {  
    if (!prot.includes(x)) return true
    return false
  })
  return valid.includes(true)
}

module.exports = getProtocol