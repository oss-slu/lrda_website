using UnityEngine;

public class UFOController : MonoBehaviour
{
    public float moveSpeed = 2f;     
    public float hoverSpeed = 2f;    
    public float hoverHeight = 0.5f;  
    public float rotationSpeed = 30f; 

    private float startY;

    void Start()
    {
        startY = transform.position.y; 
    }

    void Update()
    {
        transform.position += Vector3.right * moveSpeed * Time.deltaTime;

        float newY = startY + Mathf.Sin(Time.time * hoverSpeed) * hoverHeight;
        transform.position = new Vector3(transform.position.x, newY, transform.position.z);

        transform.Rotate(Vector3.up * rotationSpeed * Time.deltaTime);
    }
}
